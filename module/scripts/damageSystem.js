import {translations, healTranslations, phrases, criticalEffects, hitZones} from "./data.js";
import {AttackSystem} from "./attackSystem.js";
import {BodySystem} from "./bodySystem.js";
import {DiceSystem} from "./diceSystem.js";

export class DamageSystem {
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
        finalDamage = Number(roll.evaluate({maximize: true}).total);
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

      const portraitImg = actor.img || "";
      const message = `
        <h3>🩺 Отхилено: ${actor.name}</h3>
        ${portraitImg ? `<img src="${portraitImg}" style="width:50px; height:50px; border-radius:8px; margin-bottom:10px;">` : ""}
        <p><b>Общее ХП:</b> <b style="color: #28a745;">${result.maxHP}</b></p>
        <p><b>Положительное ХП:</b> <b style="color: #28a745;">${result.positiveHP}</b></p>
        <p><b>Части тела:</b></p>
        <details>
          <summary style="cursor: pointer; user-select: none;">Показать/Скрыть</summary>
          <ul>${partsList}</ul>
        </details>
      `;

      await ChatMessage.create({
        content: message,
        whisper: ChatMessage.getWhisperRecipients("GM")
      });

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
      "system.props.Life_Points_Total": (Number(actor.system.props.Life_Points_Total) || 0) + lastDamageData.damage,
      "system.props.Life_Points_Positive": (Number(actor.system.props.Life_Points_Positive) || 0) + lastDamageData.damage,
      [tablePath]: updatedTable
    });

    return {
      restoredDamage: lastDamageData.damage,
      newTotal: (Number(actor.system.props.Life_Points_Total) || 0) + lastDamageData.damage,
      newPositive: (Number(actor.system.props.Life_Points_Positive) || 0) + lastDamageData.damage
    };
  }
}