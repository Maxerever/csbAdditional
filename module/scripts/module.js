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

            // Типы урона
            const damageTypes = {
                slashing: "Рубящий",
                piercing: "Колющий",
                bludgeoning: "Дробящий"
            };
            
            const hitZones = {
    "head": -5, "torso": 0, "chest": -1, "stomach": -2,
    "leftHand": -3, "leftShoulder": -3, "leftElbow": -6,
    "leftForearm": -5, "leftWrist": -7, "rightHand": -3,
    "rightShoulder": -3, "rightElbow": -6, "rightForearm": -5,
    "rightWrist": -7, "leftLeg": -3, "leftThigh": -4,
    "leftKnee": -6, "leftShin": -5, "leftFoot": -7,
    "rightLeg": -3, "rightThigh": -4, "rightKnee": -6,
    "rightShin": -5, "rightFoot": -7
};

            // Формируем HTML для диалога
            let html = `<form>
<div class="form-group">`;
            html += `<label>Атакующий: ${actor.name}</label`;
            html += `<label>Часть тела:</label>
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
        </div>
    </form>`;

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

            const zoneLabel = translations[zone] || zone;
            const penalty = Number(hitZones[zone] ?? 0);

            const attackRoll = new Roll("1d20");
            await attackRoll.evaluate();
            await attackRoll.toMessage({
                flavor: `🎯 <b>${actor.name}</b> атакует <b>${target.name}</b> по: <b>${zoneLabel}</b> (нужно ≤ навык + ${penalty})`,
                    flags: {
                        "csbAdditional_damageData": {
                            attackerName: actor.name,
                            targetActorId: target.id,
                            zone: zone,
                            zoneLabel: zoneLabel,
                            damage: damageRoll.total,
                            damageType: damageType,
                            damageFormula: damageFormula
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

                    "csbAdditional_damageData": {
                        attackerName: actor.name,
                        targetActorId: target.id,
                        zone: zone,
                        zoneLabel: zoneLabel,
                        damage: damageRoll.total,
                        damageType: damageType,
                        damageFormula: damageFormula

Hooks.on("createChatMessage", async (message) => {
    if (!message.getFlag("cabAdditional_damageData")) return;
    if (!game.user.isGM) return;

    const data = message.getFlag("cabAdditional_damageData");
    const target = game.actors.get(data.targetActorId);
    if (!target) return;

    const zone = data.zone;
    const damage = data.damage;

    const damageRoll = new Roll(damageFormula);
    await damageRoll.evaluate();
    await damageRoll.toMessage({
        flavor: `💥 <b>${actor.name}</b> пытается нанести <b>${damageRoll.total}</b> ${damageTypes[damageType]} урона по <b>${zoneLabel}</b> (<b>${target.name}</b>)`,
        whisper: ChatMessage.getWhisperRecipients("GM")
    });

    const currentHP_part = Number(target.system.props?.[zone]) || 0;
    const currentHP_main = Number(target.system.props?.Life_Points_Total) || 0;
    const currentHP_positive = Number(target.system.props?.Life_Points_Positive) || 0;

    const newHP_part = Math.max(0, currentHP_part - damage);
    const newHP_main = Math.max(0, currentHP_main - damage);
    const newHP_positive = Math.max(0, currentHP_positive - damage);

    await target.update({
        [`system.props.${zone}`]: newHP_part,
        "system.props.Life_Points_Total": newHP_main,
        "system.props.Life_Points_Positive": newHP_positive
    });




    ChatMessage.create({
        content: `<b>${data.attackerName}</b> попал по <b>${data.zoneLabel}</b> персонажа <b>${target.name}</b>
         и нанёс <span style="color:darkred"><b>${data.damageType}</b><b>${damage}</b></span> урона.<br>❤️ HP: <b style="color:green">${newHP_main}</b>`
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





