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

Hooks.once("init", () => {
    game.csbAadditional = {
        attack: async (difficulty, actor, damage) => {
            if (!actor) return ui.notifications.warn("Выберите атакующего персонажа");

            const target = Array.from(game.user.targets)[0]?.actor;
            if (!target) return ui.notifications.warn("Цель не выбрана");

            const damageTypes = {
                slashing: "Рубящий",
                piercing: "Колющий",
                bludgeoning: "Дробящий"
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
                <input type="text" name="damage" value="${damage}" pattern="^\\d+d\\d+(\\+\\d+)?$" title="Например: 2d6+3" />
                </div></form>`;

            let zone, damageType, damageFormula;
            try {
                ({ zone, damageType, damage: damageFormula } = await Dialog.prompt({
                    title: "Выбор зоны и типа урона",
                    content: html,
                    label: "Атаковать",
                    callback: html => ({
                        zone: html.find("select[name='zone']").val(),
                        damageType: html.find("select[name='damageType']").val(),
                        damage: html.find("input[name='damage']").val()
                    })
                }));
            } catch {
                return;
            }

            if (!damageFormula.match(/^\d+d\d+(\+\d+)?$/)) {
                return ui.notifications.warn("Некорректная формула урона");
            }

            const zoneLabel = translations[zone] || zone;
            const penalty = Number(hitZones[zone] ?? 0);

            // 1) Бросок урона для отображения
            const damageRoll = new Roll(damageFormula);
            await damageRoll.evaluate({ async: true });

            // 2) Сообщение с флагом исходных данных (чтобы потом создать сообщение с кнопкой)
            await ChatMessage.create({
                content: `<b>${actor.name}</b> атакует <b>${target.name}</b> по <b>${zoneLabel}</b> (нужно ≤ навык + ${penalty}).<br>
                          Попытка урона: <b>${damageRoll.total}</b> (${damageType})<br><br>
                          <button class="apply-damage-button">✅ Применить урон</button>`,
                flags: {
                    csbAdditional: {
                        applyDamage: {
                            attackerName: actor.name,
                            targetActorId: target.id,
                            zone: zone,
                            zoneLabel: zoneLabel,
                            amount: damageRoll.total,
                            damageType: damageType
                    }
                    }
                }
            });
        },
        createBody: async () => {

                const actor = Object.values(ui.windows)
                    .filter(w => w.actor && w.rendered)
                    .map(w => w.actor)
                    .find(a => a);

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

        },
        heal: async () => {

                const actor = Object.values(ui.windows)
                    .filter(w => w.actor && w.rendered)
                    .map(w => w.actor)
                    .find(a => a);

                if (!actor) return ui.notifications.warn("Откройте лист персонажа!");

                const maxHP = Number(actor.system.props.healthPoints_max) || 0;
                const positiveHP = Math.round(maxHP * 0.4);

                const updates = {
                    "system.props.Life_Points_Total": String(maxHP),
                    "system.props.Life_Points_Positive": String(positiveHP)
                };

                const tableKey = "system_hp_dr";
                const tablePath = `system.${tableKey}`;
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

        ${portraitImg ? `<img src="${portraitImg}" alt="Portrait" style="max-width:100px; max-height:100px; border-radius:8px; margin-bottom:10px;">` : ""}
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
    };
});


// Обработка кнопки "Применить урон"
Hooks.on("renderChatMessage", (message, html, data) => {
    const damageData = message.getFlag("csbAdditional","applyDamage");
    if (!damageData) return;

    if (!game.user.isGM) {
        html.find(".apply-damage-button").remove();
        return;
    }

    html.find(".apply-damage-button").on("click", async () => {
        const actor = game.actors.get(damageData.targetActorId);
        if (!actor) return;

        const zone = damageData.zone;
        const damage = damageData.amount;

        // Взял из твоего финального кода:
        const system = actor.system;
        const totalHP = Number(system.props.Life_Points_Total) || 0;
        const positiveHP = Number(system.props.Life_Points_Positive) || 0;

        const tableKey = "system_hp_dr";
        const hpTable = system[tableKey] || {};

        // Найдём нужную часть тела
        const partEntry = Object.entries(hpTable).find(([key, row]) => row.parts === zone || row.column1 === zone);
        const updatedTable = foundry.utils.deepClone(hpTable);

        if (partEntry) {
            const [partKey, partData] = partEntry;
            const currentHp = Number(partData.hp_percent || 0);
            updatedTable[partKey].hp_percent = Math.max(0, currentHp - damage);
        }

        // Обновляем общее и положительное HP
        const newTotal = Math.max(0, totalHP - damage);
        const newPositive = Math.max(0, positiveHP - damage);

        await actor.update({
            "system.props.Life_Points_Total": String(newTotal),
            "system.props.Life_Points_Positive": String(newPositive),
            [`system.${tableKey}`]: updatedTable
        });

        ChatMessage.create({
            whisper: ChatMessage.getWhisperRecipients("GM"),
            content: `<b>${actor.name}</b> получил <b style="color:darkred">${damage}</b> <b>${damageData.damageType}</b> урона по <b>${damageData.zoneLabel}</b>.<br>
                      ❤️ Общее HP: <b style="color:green">${newTotal}</b><br>
                      💚 Положительное HP: <b style="color:green">${newPositive}</b><br>
                      🦴 Часть тела <b>${damageData.zoneLabel}</b>: <b style="color:red">${Math.max(0, (partEntry ? partEntry[1].hp_percent : 0) - damage)}</b>`
        });

        // Деактивируем кнопку, чтобы нельзя было повторно применить урон
        html.find(".apply-damage-button").prop("disabled", true).text("✅ Урон применён");
    });
});

async function addRowsToDynamicTable(actor, tableKey, newRows) {
    // Путь к таблице в системе
    const tablePath = `system.${tableKey}`;
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





