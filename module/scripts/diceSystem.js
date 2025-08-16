import {translations, healTranslations, phrases, criticalEffects, hitZones} from "./data.js";
import {DamageSystem} from "./damageSystem.js";
import {AttackSystem} from "./attackSystem.js";
import {BodySystem} from "./bodySystem.js";

export class DiceSystem {
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
        formula = "2d20kl";
        modeMessage = `<b style="color:darkgreen">Преимущество</b>`;
      } else if (result.mode === "disadvantage") {
        formula = "2d20kh";
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