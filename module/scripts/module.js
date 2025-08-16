import {translations, healTranslations, phrases, criticalEffects, hitZones} from "./data.js";
import {DamageSystem} from "./damageSystem.js";
import {AttackSystem} from "./attackSystem.js";
import {BodySystem} from "./bodySystem.js";
import {DiceSystem} from "./diceSystem.js";

Hooks.once("init", () => {
  game.csbadditional = {
    heal: DamageSystem.healActor,
    attack: AttackSystem.executeAttack,
    createBody: BodySystem.createBodyParts,
    throwDice: DiceSystem.rollDice
  };
});

Hooks.on("renderChatMessage", (message, html, data) => {
    const hideHpData = message.getFlag("csbadditional", "hidehp");
    if (hideHpData && !game.user.isGM) {
      html.find(".hide-hp").html(`<span style="color:gray; font-style:italic;">???</span>`);
    }
});

Hooks.on("renderChatMessage", (message, html, data) => {
  const damageData = message.getFlag("csbadditional", "applyDamage");

  if (!damageData) return;


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
          <b>${actor.name}</b> получил <b style="color:darkred">${result.finalDamage}</b> урона по <b>${result.zoneLabel}</b>, ${phrase} <b>${result.weapon}</b> персонажа <b>${result.attackerName}</b>.<br>
          ❤️ Общее HP: <b class="hide-hp">${result.newTotal}</b><br>
          💚 Положительное HP: <b class="hide-hp">${result.newPositive}</b><br>
          🦴 Часть тела: <b class="hide-hp">${result.newHpPart}</b> HP
          <br><button class="apply-reset-button" disabled title="Отмена" style="padding: 5px;">🩹</button>
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
      html.find(".apply-heal-button").prop("disabled", false);
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
          <b style="color:darkred">КРИТ:</b> <b>${actor.name}</b> получил <b style="color:darkred">${result.finalDamage}</b> урона по <b>${result.zoneLabel}</b>, ${phrase} <b>${result.weapon}</b> персонажа <b>${result.attackerName}</b>.<br>
          ${result.damageNote}
          ❤️ Общее HP: <b class="hide-hp">${result.newTotal}</b><br>
          💚 Положительное HP: <b class="hide-hp">${result.newPositive}</b><br>
          🦴 Часть тела: <b class="hide-hp">${result.newHpPart}</b> HP
          <br><button class="apply-reset-button" disabled title="Отмена" style="padding: 5px;">🩹</button>
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
      html.find(".apply-heal-button").prop("disabled", false);
    } catch (err) {
      button.prop("disabled", false).text("🔥");
      if (err !== "") ui.notifications.error(err.message || "Отменено");
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

      button.text("✅");
      html.find(".apply-damage-button").prop("disabled", false).text("⚔️");
      html.find(".apply-critical-button").prop("disabled", false).text("🔥");
    } catch (err) {
      button.prop("disabled", false).text("❤️");
      ui.notifications.error(err.message);
    }
  });
});

Hooks.on("renderChatMessage", (message, html, data) => {

  const lastDamage = message.getFlag("csbadditional","lastDamage");
  if (!lastDamage)
    return;

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
        `,
        whisper: ChatMessage.getWhisperRecipients("GM")
      });

      button.text("✅");
    } catch (err) {
      button.prop("disabled", false).text("🩹");
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
