const translations = {
    head: "Голова",
    torso: "Торс",
    chest: "Грудь",
    stomach: "Живот",
    leftHand: "Левая рука",
    leftShoulder: "Левое плечо",
    leftElbow: "Левый локоть",
    leftForearm: "Левое предплечье",
    leftWrist: "Левое запястье",
    rightHand: "Правая рука",
    rightShoulder: "Правое плечо",
    rightElbow: "Правый локоть",
    rightForearm: "Правое предплечье",
    rightWrist: "Правое запястье",
    leftLeg: "Левая нога",
    leftThigh: "Левое бедро",
    leftKnee: "Левое колено",
    leftShin: "Левая голень",
    leftFoot: "Левая стопа",
    rightLeg: "Правая нога",
    rightThigh: "Правое бедро",
    rightKnee: "Правое колено",
    rightShin: "Правая голень",
    rightFoot: "Правая стопа",
};

const criticalEffects = {
    1: { label: "Урон ×3", modifier: 3 },
    2: { label: "Урон ×2", modifier: 2 },
    3: { label: "Максимальный урон", type: "max" },
    4: { label: "Урон по DR считается как 100%", note: "DR игнорируется, урон 100%." },
    5: { label: "Двойной шок при уроне сквозь DR", note: "При прохождении DR — двойной шок и травма части тела." },
    6: { label: "Обычный урон, цель роняет предметs", note: "Цель роняет всё, что держит." },
    7: { label: "DR не защищает", note: "Цель теряет защиту от DR." },
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
  
// Инициализация
Hooks.once("init", () => {
    game.csbadditional = game.csbadditional || {};
    game.csbadditional.heal = Heal;
    game.csbadditional.attack = Attack;
    game.csbadditional.createBody = CreateBody;
});


// Обработка кнопки "Применить урон"
Hooks.on("renderChatMessage", (message, html, data) => {
    const damageData = message.getFlag("csbadditional", "applyDamage");
    const lastDamage = message.getFlag("csbadditional", "lastDamage");
    if (!damageData && !lastDamage) return;

    if (!game.user.isGM) {
        html.find(".apply-damage-button").remove();
        html.find(".apply-critical-button").remove();
        html.find(".apply-reset-button").remove();
        html.find(".apply-heal-button").remove();
        return;
    }

    html.find(".apply-damage-button").on("click", async () => {
        const actor = game.actors.get(damageData.targetActorId);
        if (!actor) return;

        const zone = damageData.zone;
        const damage = damageData.amount;
        let finalDamage = damage;

        let damageTypeLabel;
        switch (damageData.damageType) {
            case "slashing":
            damageTypeLabel = "Рубящий";
            break;
        case "piercing":
            damageTypeLabel = "Колющий";
            break;
        case "bludgeoning":
            damageTypeLabel = "Дробящий";
            break;
        default:
            damageTypeLabel = damageData.damageType; // запасной вариант
        }

        // Достаём данные из props
        const system = actor.system;
        const totalHP = Number(system.props.Life_Points_Total) || 0;
        const positiveHP = Number(system.props.Life_Points_Positive) || 0;

        const tablePath = "system.props.system_hp_dr";
        const hpTable = foundry.utils.getProperty(actor, tablePath) || {};
        const updatedTable = foundry.utils.deepClone(hpTable);
console.log(hpTable);
        // Находим нужную часть тела
        const partEntry = Object.entries(hpTable).find(([_, row]) => row.parts === zone || row.column1 === zone);

        let newHpPart = 0;

        if (partEntry) {
            const [partKey, partData] = partEntry;
            const currentHp = Number(partData.hp_percent || 0);
            const DR = Number(partData.DR || 0); // DR с заглавными буквами

            switch (damageData.damageType) {
                case "piercing": {
                    const pierced = Math.max(0, finalDamage - DR);
                    finalDamage = pierced + Math.ceil(pierced * 0.5); // +50%
                    break;
                }
                case "bludgeoning": {
                    const reducedDR = DR / 2;
                    finalDamage = Math.max(0, finalDamage - reducedDR);
                    break;
                }
                default:
                    finalDamage = Math.max(0, finalDamage - DR);
                    break;
                }

            newHpPart =  currentHp - finalDamage;
            updatedTable[partKey].hp_percent = newHpPart;
        }



        // Вычисляем новое общее HP
        const newTotal = totalHP - finalDamage;
        const newPositive = positiveHP - finalDamage;


        // Обновляем персонажа
        await actor.update({
            "system.props.Life_Points_Total": String(newTotal),
            "system.props.Life_Points_Positive": String(newPositive),
            [tablePath]: updatedTable
        });
                    // Получаем портрет персонажа
                    const portraitImg = actor.img || "";


        
        ChatMessage.create({
            
            content: `
            ${portraitImg ? `<img src="${portraitImg}" alt="Portrait" style="width:50px; height:50px; border-radius:8px; margin-bottom:10px;">\n` : ""}
                <b>${actor.name}</b> получил <b style="color:darkred">${finalDamage}</b> <b>${damageTypeLabel}</b> урона по <b>${damageData.zoneLabel}</b>.<br>
                ❤️ Общее HP: <b class="hide-hp" style="color:green">${newTotal}</b><br>
                💚 Положительное HP: <b class="hide-hp" style="color:green">${newPositive}</b><br>
                🦴 Часть тела <b>${damageData.zoneLabel}</b>: <b class="hide-hp" style="color:red">${newHpPart}</b> HP
            `,
                flags: {
                    csbadditional: {
                        hidehp: {
                            attackerName: "актёр"
                        },
                        lastDamage: {
                            damage: finalDamage
                        }
                    }
                }
        });

        html.find(".apply-damage-button").prop("disabled", true).text("✅ Урон применён");
        html.find(".apply-critical-button").prop("disabled", true).text("✅ Урон применён");
        html.find(".apply-reset-button").prop("disabled", false);
        html.find(".apply-heal-button").prop("disabled", false).text("❤️ Исцелить");
    });

    html.find(".apply-critical-button").on("click", async () => {
          const options = Object.entries(criticalEffects).map(([key, { label }]) => `<option value="${key}">${key}. ${label}</option>`).join("");

    const content = `
    <form>
      <div class="form-group">
        <label>Критический эффект:</label>
        <select name="crit">${options}</select>
      </div>
    </form>
    `;

    let selectedKey;
    try {
        selectedKey = await Dialog.prompt({
        title: "Выберите критический эффект",
        content,
        label: "Подтвердить",
        callback: html => html.find("select[name='crit']").val()
        });
    } catch {
        return;
    }

    const effect = criticalEffects[selectedKey];
    const actor = game.actors.get(damageData.targetActorId);
    if (!actor) return;

    const zone = damageData.zone;
    let damage = Number(damageData.amount);
    let finalDamage = damage;

    // Рассчёт модификации урона
    if (effect.modifier) {
        finalDamage *= effect.modifier;
    } else if (effect.type === "max" && damageData.originalFormula) {
        const roll = await new Roll(damageData.originalFormula).roll();
        let rollResult = roll.total;
        finalDamage = roll.terms.reduce((sum, term) => {
        if (term.faces && term.number) return sum + term.number * term.faces;
        if (typeof term === "number") return sum + term;
        return sum;
        }, 0);
    }

        let damageTypeLabel;
        switch (damageData.damageType) {
            case "slashing":
            damageTypeLabel = "Рубящий";
            break;
        case "piercing":
            damageTypeLabel = "Колющий";
            break;
        case "bludgeoning":
            damageTypeLabel = "Дробящий";
            break;
        default:
            damageTypeLabel = damageData.damageType; // запасной вариант
        }

        // Достаём данные из props
        const system = actor.system;
        const totalHP = Number(system.props.Life_Points_Total) || 0;
        const positiveHP = Number(system.props.Life_Points_Positive) || 0;

        const tablePath = "system.props.system_hp_dr";
        const hpTable = foundry.utils.getProperty(actor, tablePath) || {};
        const updatedTable = foundry.utils.deepClone(hpTable);
console.log(hpTable);
        // Находим нужную часть тела
        const partEntry = Object.entries(hpTable).find(([_, row]) => row.parts === zone || row.column1 === zone);

        let newHpPart = 0;

        if (partEntry) {
            const [partKey, partData] = partEntry;
            const currentHp = Number(partData.hp_percent || 0);
            const DR = Number(partData.DR || 0); // DR с заглавными буквами

            switch (damageData.damageType) {
                case "piercing": {
                    const pierced = Math.max(0, finalDamage - DR);
                    finalDamage = pierced + Math.round(pierced * 0.5); // +50%
                    break;
                }
                case "bludgeoning": {
                    const reducedDR = Math.round(DR / 2);
                    finalDamage = Math.max(0, finalDamage - reducedDR);
                    break;
                }
                default:
                    finalDamage = Math.max(0, finalDamage - DR);
                    break;
                }

            newHpPart =  currentHp - finalDamage;
            updatedTable[partKey].hp_percent = newHpPart;
        }



        // Вычисляем новое общее HP
        const newTotal = totalHP - finalDamage;
        const newPositive = positiveHP - finalDamage;

        // Обновляем персонажа
        await actor.update({
            "system.props.Life_Points_Total": String(newTotal),
            "system.props.Life_Points_Positive": String(newPositive),
            [tablePath]: updatedTable
        });

        // Получаем портрет персонажа
        const portraitImg = actor.img || "";
        const note = effect.note ? `<br><i>⚠ ${effect.note}</i>` : "";


        
        ChatMessage.create({
            
            content: `
            ${portraitImg ? `<img src="${portraitImg}" alt="Portrait" style="width:50px; height:50px; border-radius:8px; margin-bottom:10px;">\n` : ""}
                КРИТ: <b>${actor.name}</b> получил <b style="color:darkred">${finalDamage}</b> <b>${damageTypeLabel}</b> урона по <b>${damageData.zoneLabel}</b>.<br>
                ❤️ Общее HP: <b class="hide-hp" style="color:green">${newTotal}</b><br>
                💚 Положительное HP: <b class="hide-hp" style="color:green">${newPositive}</b><br>
                🦴 Часть тела <b>${damageData.zoneLabel}</b>: <b class="hide-hp" style="color:red">${newHpPart}</b> HP
            `,
                flags: {
                    csbadditional: {
                        hidehp: {
                            attackerName: "актёр"
                        },
                        lastDamage: {
                            damage: finalDamage
                        }
                    }
                }
        });

        html.find(".apply-damage-button").prop("disabled", true).text("✅ Урон применён");
        html.find(".apply-critical-button").prop("disabled", true).text("✅ Урон применён");
        html.find(".apply-reset-button").prop("disabled", false);
        html.find(".apply-heal-button").prop("disabled", false).text("❤️ Исцелить");
    });

    html.find(".apply-reset-button").on("click", async () => {
    
    const actor = game.actors.get(damageData.targetActorId);
    if (!actor) return;

    const zone = damageData.zone;
    let lastdamage = Number(damageData.amount);

        // Достаём данные из props
        const system = actor.system;
        const totalHP = Number(system.props.Life_Points_Total) || 0;
        const positiveHP = Number(system.props.Life_Points_Positive) || 0;

        const tablePath = "system.props.system_hp_dr";
        const hpTable = foundry.utils.getProperty(actor, tablePath) || {};
        const updatedTable = foundry.utils.deepClone(hpTable);
console.log(hpTable);
        // Находим нужную часть тела
        const partEntry = Object.entries(hpTable).find(([_, row]) => row.parts === zone || row.column1 === zone);

        let newHpPart = 0;

        if (partEntry) {
            const [partKey, partData] = partEntry;
            const currentHp = Number(partData.hp_percent || 0);

            newHpPart =  currentHp + lastdamage;
            updatedTable[partKey].hp_percent = newHpPart;
        }

        // Вычисляем новое общее HP
        const newTotal = totalHP + lastdamage;
        const newPositive = positiveHP + lastdamage;

        // Обновляем персонажа
        await actor.update({
            "system.props.Life_Points_Total": String(newTotal),
            "system.props.Life_Points_Positive": String(newPositive),
            [tablePath]: updatedTable
        });

        html.find(".apply-damage-button").prop("disabled", false).text("⚔️ Урон");
        html.find(".apply-critical-button").prop("disabled", false).text("🔥 Крит");
        html.find(".apply-reset-button").prop("disabled", true).text("✅ Урон отменён");
        html.find(".apply-heal-button").prop("disabled", false).text("❤️ Исцелить");
    });

    html.find(".apply-heal-button").on("click", async () => {
    
    const actor = game.actors.get(damageData.targetActorId);
    if (!actor) return;

        game.csbadditional.heal(actor);

        html.find(".apply-damage-button").prop("disabled", false).text("⚔️ Урон");
        html.find(".apply-critical-button").prop("disabled", false).text("🔥 Крит");
        html.find(".apply-reset-button").prop("disabled", true).text("✅ Урон отменён");
        html.find(".apply-heal-button").prop("disabled", true).text("✅ Отхилен");
    });

});

Hooks.on("renderChatMessage", (message, html, data) => {
  const hideHpData = message.getFlag("csbadditional", "hidehp");
  if (!hideHpData) return;

  if (!game.user.isGM) {
    html.find(".hide-hp").each((i, el) => {
      el.innerHTML = `<span style="color:gray; font-style:italic;">???</span>`;
    });
  }
});

async function addRowsToDynamicTable(actor, tableKey, newRows) {
    // Путь к таблице в системе
    const tablePath = `system.props.${tableKey}`;
    // Получаем текущую таблицу (объект) из actor.system
    const currentTable = foundry.utils.getProperty(actor.system, tablePath) || {};

    // Находим максимальный числовой ключ в таблице
    const keys = Object.keys(currentTable).map(k => Number(k)).filter(n => !isNaN(n));
    const maxKey = keys.length ? Math.max(...keys) : -1;

    // Добавляем новые строки с новыми ключами
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

    // Обновляем актёра с новой таблицей
    await actor.update({ [tablePath]: currentTable });
}

async function Heal(actor) {
 if (!actor) return ui.notifications.warn("Откройте лист персонажа!");

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

                ui.notifications.info("Все части тела восстановлены до максимума HP");

                if (game.user.isGM) {
                    const partsList = Object.values(updatedTable)
                        .filter(row => !row.$deleted)
                        .map(row => {
                            const key = row.parts || row.column1 || "Неизвестная часть";
                            const name = translations[key] || key;
                            const hp = row.hp_percent ?? 0;
                            return `<li><b>${name}</b>: <span style="color: #28a745; font-weight: bold;">${hp}</span></li>`;
                        })
                        .join("");

                    // Получаем портрет персонажа
                    const portraitImg = actor.img || "";

                    const message = `
      <h3>🩺 Отхилено: @Actor[${actor.id}]{${actor.name}}</h3>

        ${portraitImg ? `<img src="${portraitImg}" alt="Portrait" style="width:50px; height:50px; border-radius:8px; margin-bottom:10px;">\n` : ""}
      <p><b>Общее ХП:</b> <b style="color: #28a745; font-weight: bold;">${maxHP}</b></p>
      <p><b>Положительное ХП:</b> <b style="color: #28a745; font-weight: bold;">${positiveHP}</b></p>
      <p><b>Части тела:</b></p>
      <details>
        <summary style="cursor: pointer; user-select: none;">Показать / Скрыть части тела</summary>
        <ul>
          ${partsList}
        </ul>
      </details>
    `;

                    ChatMessage.create({
                        content: message,
                        whisper: ChatMessage.getWhisperRecipients("GM")
                    });
                }
}

async function Attack(currentDifficulty, actor, damage) {
            if (!actor) return ui.notifications.warn("Выберите атакующего персонажа");

            const target = Array.from(game.user.targets)[0]?.actor;
            if (!target) return ui.notifications.warn("Цель не выбрана");

            const damageTypes = {
                slashing: "Рубящий",
                piercing: "Колющий",
                bludgeoning: "Дробящий"
            };

            let difficulty = Number(currentDifficulty);

            let html = `<form><div class="form-group">
                <label>Атакующий: ${actor.name}</label>
                <label>Часть тела:</label>
                <select name="zone">`;
            for (const [zone, penalty] of Object.entries(hitZones)) {
                const label = translations[zone] || zone;
                html += `<option value="${zone}">${label} (Штраф: ${penalty})</option>`;
            }
            html += `</select></div>
                <div class="form-group">
                <label>Тип урона:</label>
                <select name="damageType">`;
            for (const [type, label] of Object.entries(damageTypes)) {
                html += `<option value="${type}">${label}</option>`;
            }
            html += `</select></div>
                <div class="form-group">
                <label>Урон:</label>
                <input type="text" name="damage" value="${damage}" pattern="^(\\d+d\\d+(\\+\\d+)?|\\d+)$" title="Например: 2d6+3" />
                <label>Сложность:</label>
                <input type="text" name="difficulty" value="${difficulty}" pattern="^([1-9]|[1-9][0-9])$" title="Например: 15" />
                </div></form>`;

            let zone, damageType, damageFormula;
            try {
                ({ zone, damageType, damage: damageFormula, difficulty } = await Dialog.prompt({
                    title: "Выбор зоны и типа урона",
                    content: html,
                    label: "Атаковать",
                    callback: html => ({
                        zone: html.find("select[name='zone']").val(),
                        damageType: html.find("select[name='damageType']").val(),
                        damage: html.find("input[name='damage']").val(),
                        difficulty: Number(html.find("input[name='difficulty']").val())
                    })
                }));
            } catch {
                return;
            }


            const zoneLabel = translations[zone] || zone;
            const penalty = Number(hitZones[zone] ?? 0);
            
            const roll = await new Roll("1d20").roll();
            let rollResult = roll.total;
            // 1) Бросок урона для отображения
            const damageRoll = await new Roll(damageFormula).roll();
            let damageRollResult = damageRoll.total;
            let rollmessage = "";
            let finalDifficulty = difficulty + penalty - Number(target.system.props.passiveDefence);
            if (rollResult == 1) {
                rollmessage = "Крит. попадание!"
                const critRoll = await new Roll("1d8").roll();
                let critRollResult = critRoll.total;
                const effect = criticalEffects[critRollResult];
                critRoll.toMessage({
                    speaker: ChatMessage.getSpeaker(),
                    flavor: `Критическое действие: ${effect?.label || "неизвестно"}${effect?.note ? `<br><i>${effect.note}</i>` : ""}`
                });
            }
            else if(rollResult == 20) {
                rollmessage = "Крит. промах!"
            }
            else if(rollResult < finalDifficulty) {
                rollmessage = "Попадание!";
            }
            else {
                rollmessage = "Промах!";
            }

                roll.toMessage({
                speaker: ChatMessage.getSpeaker(),
                flavor: `Бросок на попадание: ${rollmessage}\nСложность: ${finalDifficulty}` 
            });
            


            // 2) Сообщение с флагом исходных данных (чтобы потом создать сообщение с кнопкой)
            damageRoll.toMessage({
                flavor: `
                            ${rollmessage}\n
                          <b>${actor.name}</b> атакует <b>${target.name}</b> по <b>${zoneLabel}</b> (нужно <= ${finalDifficulty}).<br>
                          Попытка урона: <b>${damageRollResult}</b> (${damageFormula}) (${damageTypes[damageType]})<br><br>
                          <button class="apply-damage-button">⚔️ Урон</button>
                          <button class="apply-critical-button">🔥 Крит</button>
                          <button class="apply-reset-button" disabled>🩹 Отмена</button>
                          <button class="apply-heal-button">❤️ Исцелить</button>
                          `,
                speaker: ChatMessage.getSpeaker(),
                flags: {
                    csbadditional: {
                        applyDamage: {
                            attackerName: actor.name,
                            targetActorId: target.id,
                            zone: zone,
                            zoneLabel: zoneLabel,
                            amount: damageRollResult,
                            damageType: damageType,
                            difficulty: finalDifficulty,
                            originalFormula: damageFormula
                    }
                    }
                }
            });
            
            console.log(zone, damageType, damageFormula, finalDifficulty);
}

async function CreateBody(actor) {

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

                // Замените 'dynamicTableKey' на реальный ключ вашей dynamic_table, например 'system_hp_dr'
                await addRowsToDynamicTable(actor, "system_hp_dr", newRows);

                ui.notifications.info("Новые строки добавлены в dynamic_table");

}


