const translations = {
  head: "Голове",
  torso: "Торсу",
  chest: "Груди",
  stomach: "Животу",
  leftHand: "Левой руке",
  leftShoulder: "Левому плечу",
  leftElbow: "Левому локтю",
  leftForearm: "Левому предплечью",
  leftWrist: "Левой кисти",
  rightHand: "Правой руке",
  rightShoulder: "Правому плечу",
  rightElbow: "Правому локтю",
  rightForearm: "Правому предплечью",
  rightWrist: "Правой кисти",
  leftLeg: "Левой ноге",
  leftThigh: "Левому бедру",
  leftKnee: "Левому колену",
  leftShin: "Левой голени",
  leftFoot: "Левой стопе",
  rightLeg: "Правой ноге",
  rightThigh: "Правому бедру",
  rightKnee: "Правому колену",
  rightShin: "Правая голени",
  rightFoot: "Правой стопе"
};

const healTranslations = {
  head: "Голова",
  torso: "Торс",
  chest: "Грудь",
  stomach: "Живот",
  leftHand: "Левая рука",
  leftShoulder: "Левое плечо",
  leftElbow: "Левый локоть",
  leftForearm: "Левое предплечье",
  leftWrist: "Левая кисть",
  rightHand: "Правая рука",
  rightShoulder: "Правое плечо",
  rightElbow: "Правый локоть",
  rightForearm: "Правое предплечье",
  rightWrist: "Правая кисть",
  leftLeg: "Левая нога",
  leftThigh: "Левое бедро",
  leftKnee: "Левое колено",
  leftShin: "Левая голень",
  leftFoot: "Левая стопа",
  rightLeg: "Правая нога",
  rightThigh: "Правое бедро",
  rightKnee: "Правое колено",
  rightShin: "Правая голень",
  rightFoot: "Правая стопа"
};

const phrases = [
  "от",
  "просто от неожиданного",
  "пытаясь увернуться от",
  "спасаясь бегством от сокрушительного",
  "чрезмерно засмотревшись на бабочку, не обращая внимания на",
  "не успев заметить",
  "пока был занят другими делами, полностью забыв про",
  "метафорически ослепнув от красоты",
  "решив, что справится с мощным",
  "отдав свою судьбу на суд",
  "досрочно задумав покинуть бренный мир с помощью"
];

const criticalEffects = {
  1: { label: "Урон ×3", modifier: 3 },
  2: { label: "Урон ×2", modifier: 2 },
  3: { label: "Максимальный урон", type: "max" },
  4: { label: "Урон по DR считается как 100%", note: "DR игнорируется, урон 100%." },
  5: { label: "Двойной шок при уроне сквозь DR", note: "При прохождении DR — двойной шок и травма части тела." },
  6: { label: "Обычный урон, цель роняет предметы", note: "Цель роняет всё, что держит." },
  7: { label: "DR не защищает", note: "Цель теряет защиту от DR.", type: "no_dr"},
  8: { label: "Обычный урон", modifier: 1 }
};

const hitZones = {
  head: -5, torso: 0, chest: -1, stomach: -2,
  leftHand: -3, leftShoulder: -3, leftElbow: -6,
  leftForearm: -5, leftWrist: -7, rightHand: -3,
  rightShoulder: -3, rightElbow: -6, rightForearm: -5,
  rightWrist: -7, leftLeg: -3, leftThigh: -4,
  leftKnee: -6, leftShin: -5, leftFoot: -7,
  rightLeg: -3, rightThigh: -4, rightKnee: -6,
  rightShin: -5, rightFoot: -7
};

class DamageSystem {
  static async applyDamage(actor, damageData, isCritical = false, critEffect = null) {
    const system = actor.system;
    const zone = damageData.zone;
    const tablePath = "system.props.system_hp_dr";
    const hpTable = foundry.utils.getProperty(actor, tablePath) || {};
    const updatedTable = foundry.utils.deepClone(hpTable);

    const partEntry = Object.entries(hpTable).find(([_, row]) => 
      row.parts === zone || row.column1 === zone
    );

    if (!partEntry) {
      ui.notifications.error("Часть тела не найдена");
      return null;
    }

    const [partKey, partData] = partEntry;
    const currentHp = Number(partData.hp_percent || 0);
    const drKey = `dr_${zone}`;
    const DR = Number(foundry.utils.getProperty(system.props, drKey) || 0);

    let finalDamage = damageData.amount;
    let damageNote = "";

    // Обработка критического урона
    if (isCritical && critEffect) {
      const effect = criticalEffects[critEffect];
      damageNote = effect.note ? `<br><i>⚠ ${effect.note}</i>` : "";
      
      if (effect.modifier) {
        finalDamage *= effect.modifier;
      } else if (effect.type === "max") {
        const roll = new Roll(damageData.originalFormula);
        finalDamage = roll.evaluate({maximize: true}).total;
      }
    }

    // Применение DR если не указано иное
    if (!isCritical || critEffect !== "7") {
      switch (damageData.damageType) {
        case "piercing":
          finalDamage = Math.max(0, finalDamage - DR) * 1.5;
          break;
        case "bludgeoning":
          finalDamage = Math.max(0, finalDamage - (DR / 2));
          break;
        default:
          finalDamage = Math.max(0, finalDamage - DR);
      }
    }

    const newHpPart = Math.max(0, currentHp - finalDamage);
    updatedTable[partKey].hp_percent = newHpPart;

    const totalHP = Number(system.props.Life_Points_Total) || 0;
    const positiveHP = Number(system.props.Life_Points_Positive) || 0;
    
    const newTotal = Math.max(0, totalHP - finalDamage);
    const newPositive = Math.max(0, positiveHP - finalDamage);

    await actor.update({
      "system.props.Life_Points_Total": String(newTotal),
      "system.props.Life_Points_Positive": String(newPositive),
      [tablePath]: updatedTable
    });

    return {
      finalDamage,
      newTotal,
      newPositive,
      newHpPart,
      damageNote,
      damageType: damageData.damageType,
      zoneLabel: damageData.zoneLabel,
      zoneLabelRaw: damageData.zoneLabelRaw,
      weapon: damageData.weapon,
      attackerName: damageData.attackerName,
      partKey
    };
  }

  static async healActor(actor) {
    if (!actor) return ui.notifications.warn("Актёр не найден");

    const maxHP = Number(actor.system.props.healthPoints_max) || 0;
    const positiveHP = Math.round(maxHP * 0.4);

    const updates = {
      "system.props.Life_Points_Total": String(maxHP),
      "system.props.Life_Points_Positive": String(positiveHP)
    };

    const tableKey = "system_hp_dr";
    const tablePath = `system.props.${tableKey}`;
    const currentTable = foundry.utils.getProperty(actor.system.props, tableKey) || {};

    const updatedTable = Object.entries(currentTable).reduce((acc, [key, row]) => {
      if (row.$deleted) {
        acc[key] = row;
      } else {
        acc[key] = {
          ...row,
          hp_percent: Math.round(maxHP * parseFloat(row.percent))
        };
      }
      return acc;
    }, {});

    await actor.update({
      ...updates,
      [tablePath]: updatedTable
    });

    const partsList = Object.values(updatedTable)
      .filter(row => !row.$deleted)
      .map(row => {
        const key = row.parts || row.column1 || "Неизвестная часть";
        const name = healTranslations[key] || key;
        const hp = row.hp_percent ?? 0;
        return `<li><b>${name}</b>: <span style="color: #28a745;">${hp}</span></li>`;
      })
      .join("");

    return {
      maxHP,
      positiveHP,
      partsList
    };
  }

  static async resetDamage(actor, lastDamageData) {
    if (!actor || !lastDamageData) return;

    const tablePath = "system.props.system_hp_dr";
    const hpTable = foundry.utils.getProperty(actor, tablePath) || {};
    const updatedTable = foundry.utils.deepClone(hpTable);

    if (lastDamageData.partKey) {
      const partData = updatedTable[lastDamageData.partKey];
      if (partData) {
        partData.hp_percent = (partData.hp_percent || 0) + lastDamageData.damage;
      }
    }

    await actor.update({
      "system.props.Life_Points_Total": String((Number(actor.system.props.Life_Points_Total) || 0) + lastDamageData.damage),
      "system.props.Life_Points_Positive": String((Number(actor.system.props.Life_Points_Positive) || 0) + lastDamageData.damage),
      [tablePath]: updatedTable
    });

    return {
      restoredDamage: lastDamageData.damage,
      newTotal: (Number(actor.system.props.Life_Points_Total) || 0) + lastDamageData.damage,
      newPositive: (Number(actor.system.props.Life_Points_Positive) || 0) + lastDamageData.damage
    };
  }
}

class AttackSystem {
  static async executeAttack(currentDifficulty, actor, damage, currentWeapon) {
    if (!actor) return ui.notifications.warn("Выберите атакующего персонажа");
    
    const userTarget = Array.from(game.user.targets)[0];
    if (!userTarget) return ui.notifications.warn("Цель не выбрана");

    const token = userTarget.document;
    if (!token) return ui.notifications.warn("Токен не найден");

    const target = token.actor;
    if (!target) return ui.notifications.warn("У токена нет актёра");

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
      slashing: "Рубящий",
      piercing: "Колющий",
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

    // Выполнение бросков
    for (let i = 0; i < throwParams.count; i++) {
      const roll = await AttackSystem.rollAttack(throwParams.mode, finalDifficulty);
      if (roll.isSuccess) {
        await AttackSystem.applyAttackResult(actor, target, {
          ...targetFlags,
          weapon: currentWeapon,
          zone,
          zoneLabel,
          zoneLabelRaw,
          damageType,
          amount: roll.damageResult,
          originalFormula: damageFormula,
          attackerName: actor.name
        }, damageFormula, roll.isCritical);
      }
    }
  }

  static async rollAttack(mode, difficulty) {
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

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker(),
      flavor: `${modeMessage}<br><b>Бросок на попадание:</b> ${message}<br>Сложность: <b>${Math.max(1, difficulty)}</b>`
    });

    return { isSuccess, isCritical };
  }

  static async applyAttackResult(attacker, target, targetFlags, damageFormula, isCritical) {
    const damageRoll = await new Roll(damageFormula).roll();
    const damageRollResult = damageRoll.total;

    await damageRoll.toMessage({
      speaker: ChatMessage.getSpeaker(),
      flavor: `
        <b>${attacker.name}</b> атакует <b>${target.name}</b> по <b>${targetFlags.zoneLabel}</b> с помощью <b>${targetFlags.weapon}</b>.<br>
        Попытка урона: <b>${damageRollResult}</b> (${damageFormula})<br><br>
        <div style="display: flex; gap: 5px; justify-content: center;">
          <button class="apply-damage-button" title="Урон" style="padding: 5px;">⚔️</button>
          <button class="apply-critical-button" title="Крит" style="padding: 5px;">🔥</button>
          <button class="apply-reset-button" disabled title="Отмена" style="padding: 5px;">🩹</button>
          <button class="apply-heal-button" title="Исцелить" style="padding: 5px;">❤️</button>
        </div>
      `,
      flags: {
        csbadditional: {
          applyDamage: {
            ...targetFlags,
            amount: damageRollResult,
            originalFormula: damageFormula,
            attackerName: attacker.name
          }
        }
      }
    });
  }
}

class BodySystem {
  static async createBodyParts(actor) {
    if (!actor) return ui.notifications.warn("Откройте лист персонажа!");

    const fullHp = foundry.utils.getProperty(actor.system, "healthPoints_max") || 0;

    const newRows = [
                { fullBody: "all", partBody: "up", parts: "head", percent: 0.5, hp_percent: fullHp * 0.5, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "up", parts: "torso", percent: 1, hp_percent: fullHp * 1, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "up", parts: "chest", percent: 0.5, hp_percent: fullHp * 0.5, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "up", parts: "stomach", percent: 0.5, hp_percent: fullHp * 0.5, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "up", parts: "leftHand", percent: 0.25, hp_percent: fullHp * 0.25, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "up", parts: "leftShoulder", percent: 0.1, hp_percent: fullHp * 0.1, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "up", parts: "leftElbow", percent: 0.05, hp_percent: fullHp * 0.05, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "up", parts: "leftForearm", percent: 0.1, hp_percent: fullHp * 0.1, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "wrists", parts: "leftWrist", percent: 0.05, hp_percent: fullHp * 0.05, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "up", parts: "rightHand", percent: 0.25, hp_percent: fullHp * 0.25, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "up", parts: "rightShoulder", percent: 0.1, hp_percent: fullHp * 0.1, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "up", parts: "rightElbow", percent: 0.05, hp_percent: fullHp * 0.05, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "up", parts: "rightForearm", percent: 0.1, hp_percent: fullHp * 0.1, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "wrists", parts: "rightWrist", percent: 0.05, hp_percent: fullHp * 0.05, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "down", parts: "leftLeg", percent: 0.25, hp_percent: fullHp * 0.25, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "down", parts: "leftThigh", percent: 0.1, hp_percent: fullHp * 0.1, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "down", parts: "leftKnee", percent: 0.05, hp_percent: fullHp * 0.05, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "down", parts: "leftShin", percent: 0.1, hp_percent: fullHp * 0.1, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "foots", parts: "leftFoot", percent: 0.05, hp_percent: fullHp * 0.05, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "down", parts: "rightLeg", percent: 0.25, hp_percent: fullHp * 0.25, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "down", parts: "rightThigh", percent: 0.1, hp_percent: fullHp * 0.1, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "down", parts: "rightKnee", percent: 0.05, hp_percent: fullHp * 0.05, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "down", parts: "rightShin", percent: 0.1, hp_percent: fullHp * 0.1, condition: "normal", DR: 0 },
                { fullBody: "all", partBody: "foots", parts: "rightFoot", percent: 0.05, hp_percent: fullHp * 0.05, condition: "normal", DR: 0 }
            ];

    await BodySystem.addRowsToDynamicTable(actor, "system_hp_dr", newRows);
    ui.notifications.info("Созданы части тела для персонажа");
  }

  static async addRowsToDynamicTable(actor, tableKey, newRows) {
    const tablePath = `system.props.${tableKey}`;
    const currentTable = foundry.utils.getProperty(actor.system, tablePath) || {};

    const keys = Object.keys(currentTable).map(k => Number(k)).filter(n => !isNaN(n));
    const maxKey = keys.length ? Math.max(...keys) : -1;

    let nextKey = maxKey + 1;
    for (const row of newRows) {
      currentTable[nextKey.toString()] = {
        ...row,
        $predefinedIdx: undefined,
        $deleted: false,
        $deletionDisabled: false
      };
      nextKey++;
    }

    await actor.update({ [tablePath]: currentTable });
  }
}

class DiceSystem {
  static async rollDice(difficulty, item) {
    try {
      const result = await Dialog.prompt({
        title: "Проверка броска",
        content: `
          <b>${item}</b><br><br>
          Сложность (0 если неизвестно):<br>
          <input type="number" name="difficulty" value="${difficulty}" /><br><br>
          Модификатор:<br>
          <input type="number" name="modificator" value="0" /><br><br>
          Тип броска:<br>
          <label><input type="radio" name="mode" value="normal" checked /> Обычный</label><br>
          <label><input type="radio" name="mode" value="advantage" /> Преимущество</label><br>
          <label><input type="radio" name="mode" value="disadvantage" /> Помеха</label><br><br>
          Количество бросков:<br>
          <input type="number" name="count" value="1" min="1" />
        `,
        label: "Бросить",
        callback: html => ({
          modificator: parseInt(html.find("input[name='modificator']").val() || 0),
          difficulty: parseInt(html.find("input[name='difficulty']").val() || 0),
          count: Math.max(1, parseInt(html.find("input[name='count']").val() || 1)),
          mode: html.find("input[name='mode']:checked").val()
        })
      });

      const isUnknownDifficulty = result.difficulty < 1;
      const finalDiff = isUnknownDifficulty ? "???" : result.difficulty + result.modificator;
      
      let modeMessage = `<b>Обычный бросок</b>`;
      let formula = "1d20";
      
      if (result.mode === "advantage") {
        formula = "2d20kh";
        modeMessage = `<b style="color:darkgreen">Преимущество</b>`;
      } else if (result.mode === "disadvantage") {
        formula = "2d20kl";
        modeMessage = `<b style="color:darkred">Помеха</b>`;
      }

      for (let i = 0; i < result.count; i++) {
        const roll = await new Roll(formula).roll();
        const total = roll.total;
        
        let message = "???";
        if (!isUnknownDifficulty) {
          if (total === 1) message = "Крит. успех!";
          else if (total === 20) message = "Крит. неудача!";
          else if (total <= finalDiff) message = "Успех!";
          else message = "Неудача!";
        }

        await roll.toMessage({
          speaker: ChatMessage.getSpeaker(),
          flavor: `
            ${modeMessage}<br>
            <b>${item}</b> (бросок ${i + 1})<br>
            Сложность: <b>${finalDiff}</b><br>
            Результат: <b>${message}</b>
          `
        });
      }
    } catch {
      return;
    }
  }
}

Hooks.once("init", () => {
  game.csbadditional = {
    heal: DamageSystem.healActor,
    attack: AttackSystem.executeAttack,
    createBody: BodySystem.createBodyParts,
    throwDice: DiceSystem.rollDice
  };
});

Hooks.on("renderChatMessage", (message, html, data) => {
  const damageData = message.getFlag("csbadditional", "applyDamage");
  const lastDamage = message.getFlag("csbadditional", "lastDamage");

  if (!damageData && !lastDamage) {
    const hideHpData = message.getFlag("csbadditional", "hidehp");
    if (hideHpData && !game.user.isGM) {
      html.find(".hide-hp").html(`<span style="color:gray; font-style:italic;">???</span>`);
    }
    return;
  }

  if (!game.user.isGM) {
    html.find(".apply-damage-button, .apply-critical-button, .apply-reset-button, .apply-heal-button").remove();
    return;
  }

  // Обработчик нанесения урона
  html.find(".apply-damage-button").on("click", async (event) => {
    const button = $(event.currentTarget);
    button.prop("disabled", true).text("⌛");

    try {
      const actor = await getActorFromData(damageData);
      if (!actor) throw new Error("Актёр не найден");

      const result = await DamageSystem.applyDamage(actor, damageData);
      if (!result) return;

      const portraitImg = actor.img || "";
      const phrase = phrases[Math.floor(Math.random() * phrases.length)];

      await ChatMessage.create({
        content: `
          ${portraitImg ? `<img src="${portraitImg}" style="width:50px; height:50px; border-radius:8px; margin-bottom:10px;">` : ""}
          <b>${actor.name}</b> получил <b style="color:darkred">${result.finalDamage}</b> урона по <b>${result.zoneLabel}</b>, ${phrase} <b>${result.weapon}</b>.<br>
          ❤️ Общее HP: <b>${result.newTotal}</b><br>
          💚 Положительное HP: <b>${result.newPositive}</b><br>
          🦴 Часть тела: <b>${result.newHpPart}</b> HP
        `,
        flags: {
          csbadditional: {
            lastDamage: {
              damage: result.finalDamage,
              totalHP: result.newTotal,
              positiveHP: result.newPositive,
              partHP: result.newHpPart,
              partKey: result.partKey,
              actorId: actor.id,
              tokenId: damageData.tokenId,
              sceneId: damageData.sceneId
            }
          }
        }
      });

      button.text("✅");
      html.find(".apply-critical-button").prop("disabled", true).text("✅");
      html.find(".apply-reset-button, .apply-heal-button").prop("disabled", false);
    } catch (err) {
      button.prop("disabled", false).text("⚔️");
      ui.notifications.error(err.message);
    }
  });

  // Обработчик критического урона
  html.find(".apply-critical-button").on("click", async (event) => {
    const button = $(event.currentTarget);
    button.prop("disabled", true).text("⌛");

    try {
      const options = Object.entries(criticalEffects)
        .map(([key, { label }]) => `<option value="${key}">${key}. ${label}</option>`)
        .join("");

      const critKey = await Dialog.prompt({
        title: "Выберите критический эффект",
        content: `<form><div class="form-group"><select name="crit">${options}</select></div></form>`,
        label: "Подтвердить",
        callback: html => html.find("select[name='crit']").val()
      });

      const actor = await getActorFromData(damageData);
      if (!actor) throw new Error("Актёр не найден");

      const result = await DamageSystem.applyDamage(actor, damageData, true, critKey);
      if (!result) return;

      const portraitImg = actor.img || "";
      const phrase = phrases[Math.floor(Math.random() * phrases.length)];

      await ChatMessage.create({
        content: `
          ${portraitImg ? `<img src="${portraitImg}" style="width:50px; height:50px; border-radius:8px; margin-bottom:10px;">` : ""}
          <b>КРИТ:</b> <b>${actor.name}</b> получил <b style="color:darkred">${result.finalDamage}</b> урона по <b>${result.zoneLabel}</b>, ${phrase} <b>${result.weapon}</b>.<br>
          ${result.damageNote}
          ❤️ Общее HP: <b>${result.newTotal}</b><br>
          💚 Положительное HP: <b>${result.newPositive}</b><br>
          🦴 Часть тела: <b>${result.newHpPart}</b> HP
        `,
        flags: {
          csbadditional: {
            lastDamage: {
              damage: result.finalDamage,
              totalHP: result.newTotal,
              positiveHP: result.newPositive,
              partHP: result.newHpPart,
              partKey: result.partKey,
              actorId: actor.id,
              tokenId: damageData.tokenId,
              sceneId: damageData.sceneId
            }
          }
        }
      });

      button.text("✅");
      html.find(".apply-damage-button").prop("disabled", true).text("✅");
      html.find(".apply-reset-button, .apply-heal-button").prop("disabled", false);
    } catch (err) {
      button.prop("disabled", false).text("🔥");
      if (err !== "") ui.notifications.error(err.message || "Отменено");
    }
  });

  // Обработчик отмены урона
  html.find(".apply-reset-button").on("click", async (event) => {
    const button = $(event.currentTarget);
    button.prop("disabled", true).text("⌛");

    try {
      const actor = await getActorFromData(lastDamage);
      if (!actor) throw new Error("Актёр не найден");

      const result = await DamageSystem.resetDamage(actor, lastDamage);
      if (!result) return;

      await ChatMessage.create({
        content: `
          <b>${actor.name}</b> восстановил <b style="color:green">${result.restoredDamage}</b> HP.<br>
          ❤️ Общее HP: <b>${result.newTotal}</b><br>
          💚 Положительное HP: <b>${result.newPositive}</b>
        `
      });

      button.text("✅");
      html.find(".apply-damage-button, .apply-critical-button").prop("disabled", false).text("⚔️");
      html.find(".apply-heal-button").prop("disabled", false).text("❤️");
    } catch (err) {
      button.prop("disabled", false).text("🩹");
      ui.notifications.error(err.message);
    }
  });

  // Обработчик лечения
  html.find(".apply-heal-button").on("click", async (event) => {
    const button = $(event.currentTarget);
    button.prop("disabled", true).text("⌛");

    try {
      const actor = await getActorFromData(damageData || lastDamage);
      if (!actor) throw new Error("Актёр не найден");

      const result = await DamageSystem.healActor(actor);
      
      const portraitImg = actor.img || "";
      const message = `
        <h3>🩺 Отхилено: ${actor.name}</h3>
        ${portraitImg ? `<img src="${portraitImg}" style="width:50px; height:50px; border-radius:8px; margin-bottom:10px;">` : ""}
        <p><b>Общее ХП:</b> <b style="color: #28a745;">${result.maxHP}</b></p>
        <p><b>Положительное ХП:</b> <b style="color: #28a745;">${result.positiveHP}</b></p>
        <p><b>Части тела:</b></p>
        <details>
          <summary style="cursor: pointer; user-select: none;">Показать/Скрыть</summary>
          <ul>${result.partsList}</ul>
        </details>
      `;

      await ChatMessage.create({
        content: message,
        whisper: game.user.isGM ? undefined : ChatMessage.getWhisperRecipients("GM")
      });

      button.text("✅");
      html.find(".apply-damage-button, .apply-critical-button").prop("disabled", false).text("⚔️");
      html.find(".apply-reset-button").prop("disabled", true).text("🩹");
    } catch (err) {
      button.prop("disabled", false).text("❤️");
      ui.notifications.error(err.message);
    }
  });
});

async function getActorFromData(data) {
  if (!data) return null;
  
  if (data.actorId) {
    return game.actors.get(data.actorId);
  } else if (data.tokenId && data.sceneId) {
    const scene = game.scenes.get(data.sceneId);
    const token = scene?.tokens.get(data.tokenId);
    return token?.actor;
  }
  return null;
}
