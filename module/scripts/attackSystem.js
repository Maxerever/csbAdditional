import {translations, healTranslations, phrases, criticalEffects, hitZones} from "./data.js";
import {DamageSystem} from "./damageSystem.js";
import {BodySystem} from "./bodySystem.js";
import {DiceSystem} from "./diceSystem.js";

export class AttackSystem {
  static async executeAttack(currentStatDifficulty, actor, damage, currentWeapon) {
    if (!actor) return ui.notifications.warn("Выберите атакующего персонажа");
    
    const userTarget = Array.from(game.user.targets)[0];
    if (!userTarget) return ui.notifications.warn("Цель не выбрана");

    const token = userTarget.document;
    if (!token) return ui.notifications.warn("Токен не найден");

    const target = token.actor;
    if (!target) return ui.notifications.warn("У токена нет актёра");

    let currentDifficulty = Number(actor.system.props[String(currentStatDifficulty)]);

    // Подготовка данных цели
    let targetFlags;
    if (token.actorLink) {
      targetFlags = { actorId: target.id };
    } else {
      targetFlags = {
        tokenId: token.id,
        sceneId: token.parent?.id ?? canvas.scene?.id
      };
    }

    // Диалог параметров атаки
    const damageTypes = {
      piercing: "Колющий",
      slashing: "Рубящий",
      bludgeoning: "Дробящий"
    };

    const throwDiceForm = `
      <form>
        <div class="form-group">
          <label>Сложность:</label>
          <input type="number" name="difficulty" value="${Math.max(1, Number(currentDifficulty))}" />
        </div>
        <div class="form-group">
          <label>Модификатор сложности:</label>
          <input type="number" name="modificator" value="0" />
        </div>
        <div class="form-group">
          <label>ШМА:</label>
          <input type="number" name="multiPenalty" value="0" />
        </div>
        <div class="form-group">
          <label>Продолжение ШМА (продолжить с):</label>
          <input type="number" name="multiPenaltyCheck" value="0"/>
        </div>
        <div class="form-group">
          <label>Тип броска:</label><br>
          <label><input type="radio" name="mode" value="normal" checked /> Обычный</label>
          <label><input type="radio" name="mode" value="advantage" /> Преимущество</label>
          <label><input type="radio" name="mode" value="disadvantage" /> Помеха</label>
        </div>
        <div class="form-group">
          <label>Количество бросков:</label>
          <input type="number" name="count" value="1" min="1" />
        </div>
      </form>`;

    let throwParams;
    try {
      throwParams = await Dialog.prompt({
        title: "Настройки броска атаки",
        content: throwDiceForm,
        label: "Продолжить",
        callback: html => ({
          difficulty: Number(html.find("input[name='difficulty']").val() || 0),
          modificator: Number(html.find("input[name='modificator']").val() || 0),
          multiPenalty: Number(html.find("input[name='multiPenalty']").val() || 0),
          multiPenaltyCheck: Number(html.find("input[name='multiPenaltyCheck']").val() || 0),
          mode: html.find("input[name='mode']:checked").val(),
          count: Math.max(1, Number(html.find("input[name='count']").val() || 1))
        })
      });
    } catch {
      return;
    }

    // Диалог выбора зоны попадания
    const zoneHtml = `
      <form>
        <div class="form-group">
          <label>Атакующий: ${actor.name}</label><br>
          <label>Часть тела:</label>
          <select name="zone">
            ${Object.entries(hitZones).map(([zone, penalty]) => {
              const label = healTranslations[zone] || zone;
              return `<option value="${zone}">${label} (Штраф: ${penalty})</option>`;
            }).join("")}
          </select>
        </div><br>
        <div class="form-group" style="border:1px solid black; border-radius: 8px">
          <label>Тип урона:</label>
          <select name="damageType">
            ${Object.entries(damageTypes).map(([type, label]) =>
              `<option value="${type}">${label}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label>Урон:</label>
          <input type="text" name="damage" value="${damage}" pattern="^(\\d+d\\d+(\\+\\d+)?|\\d+)$" />
        </div>
      </form>`;

    let zone, damageType, damageFormula;
    try {
      const result = await Dialog.prompt({
        title: "Параметры атаки",
        content: zoneHtml,
        label: "Атаковать",
        callback: html => ({
          zone: html.find("select[name='zone']").val(),
          damageType: html.find("select[name='damageType']").val(),
          damage: html.find("input[name='damage']").val()
        })
      });
      zone = result.zone;
      damageType = result.damageType;
      damageFormula = result.damage;
    } catch {
      return;
    }

    const zoneLabel = translations[zone] || zone;
    const zoneLabelRaw = healTranslations[zone] || zone;
    const penalty = Number(hitZones[zone] ?? 0);
    const finalDifficulty = throwParams.difficulty + throwParams.modificator + penalty - Number(target.system.props.passiveDefence);

let damageSum = 0;
let damageMultiply = [];

    // Выполнение бросков
    for (let i = 1; i <= throwParams.count; i++) {
      const roll = await AttackSystem.rollAttack(throwParams.mode, finalDifficulty, throwParams.multiPenalty, throwParams.multiPenaltyCheck, i, count);
      if (roll.isSuccess) {
        const damageRollResult = await AttackSystem.applyAttackResult(damageFormula, roll.isCritical, roll.result);
        damageSum += damageRollResult.damageRollResult;
        damageMultiply.push(damageRollResult.damageRollResult);
      }
    }

          await ChatMessage.create({
        content: `
        <b>${actor.name}</b> атакует <b>${target.name}</b> по <b>${zoneLabel}</b> с помощью <b>${currentWeapon}</b>.<br>
        Попытка урона: <b>${damageSum}</b> (${damageRollResult})<br><br>
        <details>
            <summary style="cursor: pointer; user-select: none;">Показать / скрыть броски:</summary>
            <ul>${damageMultiply}</ul>
        </details>
        <div style="display: flex; gap: 5px; justify-content: center;">
          <button class="apply-damage-button" title="Урон" style="padding: 5px;">⚔️</button>
          <button class="apply-critical-button" title="Крит" style="padding: 5px;">🔥</button>
          <button class="apply-heal-button" title="Хил" style="padding: 5px;">❤️</button>
        </div>
      `,
        whisper: ChatMessage.getWhisperRecipients("GM"),
              flags: {
        csbadditional: {
          applyDamage: {
      ...targetFlags, // содержит actorId/tokenId/sceneId
      zone: zone,
      zoneLabel: zoneLabel,
      zoneLabelRaw: zoneLabelRaw,
      amount: damageSum,
      damageType: damageType,
      weapon: currentWeapon,
      attackerName: actor.name,
      originalFormula: damageFormula,
      difficulty: finalDifficulty,
      multiPenalty: throwParams.multiPenalty,
      multiPenaltyCheck: throwParams.multiPenaltyCheck,
      damageResults: damageMultiply // массив с результатами всех бросков урона
          }
        }
      }
      });

  }

  static async rollAttack(mode, difficulty, multiPenalty, multiPenaltyCheck, i, count) {
    if(multiPenaltyCheck != 0) {
      difficulty += multiPenalty * (i + multiPenaltyCheck);
    }
    else {
      difficulty += multiPenalty * (i - 1);
    }
    
    let modeMessage = `<b>Обычный бросок</b>`;
    let attackFormula = "1d20";
    
    if (mode === "advantage") {
      attackFormula = "2d20kh";
      modeMessage = `<b style="color:darkgreen">Преимущество</b>`;
    } else if (mode === "disadvantage") {
      attackFormula = "2d20kl";
      modeMessage = `<b style="color:darkred">Помеха</b>`;
    }

    const roll = await new Roll(attackFormula).roll();
    const result = roll.total;
    
    let isCritical = false;
    let isSuccess = false;
    let message = "";
    
    if (result === 1) {
      message = "Крит. попадание!";
      isCritical = true;
      isSuccess = true;
    } else if (result === 20) {
      message = "Крит. промах!";
    } else if (result <= difficulty) {
      message = "Попадание!";
      isSuccess = true;
    } else {
      message = "Промах!";
    }

    if (count <= 1) {
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker(),
      flavor: `${modeMessage}<br><b>Бросок на попадание:</b> ${message}<br>Сложность: <b>${Math.max(1, difficulty)}</b>`
    });
    }


    return { isSuccess, isCritical, result };
  }

  static async applyAttackResult(damageFormula, isCritical, rollResult) {
    const damageRoll = await new Roll(damageFormula).roll();
    const damageRollResult = damageRoll.total;
    return {damageRollResult};
  }
}