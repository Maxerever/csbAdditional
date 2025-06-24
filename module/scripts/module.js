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
    rightFoot: "Правая стопа",
};

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
    rightFoot: "Правой стопе",
};

const phrases =  [
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
    6: { label: "Обычный урон, цель роняет предметs", note: "Цель роняет всё, что держит." },
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
  
// Инициализация
Hooks.once("init", () => {
    game.csbadditional = game.csbadditional || {};
    game.csbadditional.heal = Heal;
    game.csbadditional.attack = Attack;
    game.csbadditional.createBody = CreateBody;
    game.csbadditional.throwDice = ThrowDice;
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

let actor;

if (damageData.actorId) {
  // Связанный токен — получаем по ID актора
  actor = game.actors.get(damageData.actorId);
  if (!actor) return ui.notifications.error("Актёр не найден");
} else {
  // Несвязанный токен — получаем через сцену и токен
  const scene = game.scenes.get(damageData.sceneId);
  if (!scene) return ui.notifications.error("Сцена не найдена");

  const token = scene.tokens.get(damageData.tokenId);
  if (!token) return ui.notifications.error("Токен не найден");

  actor = token.actor;
  if (!actor) return ui.notifications.error("У токена нет актёра");
}

        const zone = damageData.zone;
        const damage = damageData.amount;
        let finalDamage = damage;

        let damageTypeLabel;
        switch (damageData.damageType) {
            case "slashing":
            damageTypeLabel = "Рубящего";
            break;
        case "piercing":
            damageTypeLabel = "Колющего";
            break;
        case "bludgeoning":
            damageTypeLabel = "Дробящего";
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
            const drKey = `dr_${zone}`;
            const DR = Number(foundry.utils.getProperty(system.props, drKey) || 0);

            switch (damageData.damageType) {
                case "piercing": {
                    const pierced = Math.max(0, finalDamage - DR);
                    finalDamage = pierced + Math.ceil(pierced * 0.5); // +50%
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

        const phrase = getRandomPhrase(phrases);
        
        ChatMessage.create({
            
            content: `
            ${portraitImg ? `<img src="${portraitImg}" alt="Portrait" style="width:50px; height:50px; border-radius:8px; margin-bottom:10px;">\n` : ""}<br>
                <b>${actor.name}</b> получил <b style="color:darkred">${finalDamage}</b> <b>${damageTypeLabel}</b> урона по <b>${damageData.zoneLabel}</b>, ${phrase} <b>${damageData.weapon}</b> персонажа <b>${damageData.attackerName}</b>.<br>
                ❤️ Общее HP: <b class="hide-hp" style="color:green">${newTotal}</b><br>
                💚 Положительное HP: <b class="hide-hp" style="color:green">${newPositive}</b><br>
                🦴 Часть тела <b>${damageData.zoneLabelRaw}</b>: <b class="hide-hp" style="color:red">${newHpPart}</b> HP
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

        html.find(".apply-damage-button").prop("disabled", true).text("✅");
        html.find(".apply-critical-button").prop("disabled", true).text("✅");
        html.find(".apply-reset-button").prop("disabled", false);
        html.find(".apply-heal-button").prop("disabled", false).text("❤️");
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
    const actor = damageData.target;
    if (!actor) return ui.notifications.error("Актёр у токена не найден");

    const zone = damageData.zone;
    let damage = Number(damageData.amount);
    let finalDamage = damage;

        // Рассчёт модификации урона
        if (effect.modifier) {
            finalDamage *= effect.modifier;
        } else if (effect.type === "max" && damageData.originalFormula) {
    const formula = damageData.originalFormula;

    let finalDamage = 0;

    // Парсим формулу в Roll, но не бросаем
    const roll = new Roll(formula);

    // Перебираем термы (части формулы)
    for (const term of roll.terms) {
        // Если терм — кубик (имеет faces и number)
        if (term.faces !== undefined && term.number !== undefined) {
            finalDamage += term.faces * term.number; // Максимум кубиков (faces * число кубиков)
        }
        // Если терм — число (может быть положительным или отрицательным)
        else if (typeof term === "number") {
            finalDamage += term; // Просто прибавляем (учитывая знак)
        }
        // Если терм - функция (например "+", "-", но обычно Roll уже их учтёт в термах), пропускаем
    }

    // Теперь finalDamage — максимальный урон с учётом плюсов и минусов

    // ... используем finalDamage дальше
} else if (effect.type === "no_dr") {

        }

        let damageTypeLabel;
        switch (damageData.damageType) {
            case "slashing":
                damageTypeLabel = "Рубящего";
                break;
            case "piercing":
                damageTypeLabel = "Колющего";
                break;
            case "bludgeoning":
                damageTypeLabel = "Дробящего";
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
            const drKey = `dr_${zone}`;
            const DR = Number(foundry.utils.getProperty(system.props, drKey) || 0);

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

        const phrase = getRandomPhrase(phrases);
        
        ChatMessage.create({
            
            content: `
            ${portraitImg ? `<img src="${portraitImg}" alt="Portrait" style="width:50px; height:50px; border-radius:8px; margin-bottom:10px;">\n` : ""}<br>
                КРИТ: <b>${actor.name}</b> получил <b style="color:darkred">${finalDamage}</b> <b>${damageTypeLabel}</b> урона по <b>${damageData.zoneLabel}</b>, ${phrase} <b>${damageData.weapon}</b> персонажа <b>${damageData.attackerName}</b>.<br>
                ❤️ Общее HP: <b class="hide-hp" style="color:green">${newTotal}</b><br>
                💚 Положительное HP: <b class="hide-hp" style="color:green">${newPositive}</b><br>
                🦴 Часть тела <b>${damageData.zoneLabelRaw}</b>: <b class="hide-hp" style="color:red">${newHpPart}</b> HP
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

        html.find(".apply-damage-button").prop("disabled", true).text("✅");
        html.find(".apply-critical-button").prop("disabled", true).text("✅");
        html.find(".apply-reset-button").prop("disabled", false);
        html.find(".apply-heal-button").prop("disabled", false).text("❤️");
    });

    html.find(".apply-reset-button").on("click", async () => {
    
    const actor = damageData.target;
    if (!actor) return ui.notifications.error("Актёр у токена не найден");

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

        html.find(".apply-damage-button").prop("disabled", false).text("⚔️");
        html.find(".apply-critical-button").prop("disabled", false).text("🔥");
        html.find(".apply-reset-button").prop("disabled", true).text("✅");
        html.find(".apply-heal-button").prop("disabled", false).text("❤️");
    });

    html.find(".apply-heal-button").on("click", async () => {
    
    const actor = damageData.target;
    if (!actor) return ui.notifications.error("Актёр у токена не найден");

        game.csbadditional.heal(actor);

        html.find(".apply-damage-button").prop("disabled", false).text("⚔️");
        html.find(".apply-critical-button").prop("disabled", false).text("🔥");
        html.find(".apply-reset-button").prop("disabled", true).text("✅");
        html.find(".apply-heal-button").prop("disabled", true).text("✅");
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
                            const name = healTranslations[key] || key;
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

async function Attack(currentDifficulty, actor, damage, currentWeapon) {
  if (!actor) return ui.notifications.warn("Выберите атакующего персонажа");

  const userTarget = Array.from(game.user.targets)[0];
  if (!userTarget) return ui.notifications.warn("Цель не выбрана");

  const token = userTarget.document;
  if (!token) return ui.notifications.warn("Токен не найден");

  const target = token.actor;
  if (!target) return ui.notifications.warn("У токена нет актёра");

  let targetFlags;
  if (token.actorLink) {
    targetFlags = { actorId: target.id };
  } else {
    targetFlags = {
      tokenId: token.id,
      sceneId: token.parent?.id ?? canvas.scene?.id
    };
  }

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

  const weapon = String(currentWeapon);
  const baseDifficulty = throwParams.difficulty;
  const modifier = throwParams.modificator;
  const mode = throwParams.mode;
  const count = throwParams.count;

  const html = `
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
    ({ zone, damageType, damage: damageFormula } = await Dialog.prompt({
      title: "Параметры атаки",
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
  const zoneLabelRaw = healTranslations[zone] || zone;
  const penalty = Number(hitZones[zone] ?? 0);
  const finalDifficulty = baseDifficulty + modifier + penalty - Number(target.system.props.passiveDefence);

  let modeMessage = `<b>Обычный бросок</b>`;
  let attackFormula = "1d20";
  if (mode === "advantage") {
    attackFormula = "2d20kh";
    modeMessage = `<b style="color:darkgreen">Преимущество</b>`;
  } else if (mode === "disadvantage") {
    attackFormula = "2d20kl";
    modeMessage = `<b style="color:darkred">Помеха</b>`;
  }

  for (let i = 0; i < count; i++) {
    const roll = await new Roll(attackFormula).roll();
    let rollResult = roll.total;
    let rollmessage = "";
    
    if (rollResult === 1) {
      rollmessage = "Крит. попадание!";
      const critRoll = await new Roll("1d8").roll();
      const effect = criticalEffects[critRoll.total];
      await critRoll.toMessage({
        speaker: ChatMessage.getSpeaker(),
        flavor: `Критическое действие: ${effect?.label || "неизвестно"}${effect?.note ? `<br><i>${effect.note}</i>` : ""}`
      });
    } else if (rollResult === 20) {
      rollmessage = "Крит. промах!";
    } else if (rollResult <= finalDifficulty) {
      rollmessage = "Попадание!";
    } else {
      rollmessage = "Промах!";
    }

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker(),
      flavor: `${modeMessage}<br><b>Бросок на попадание:</b> ${rollmessage}<br>Сложность: <b>${Math.max(1, finalDifficulty)}</b>`
    });

    const damageRoll = await new Roll(damageFormula).roll();
    const damageRollResult = damageRoll.total;

    await damageRoll.toMessage({
      speaker: ChatMessage.getSpeaker(),
      flavor: `
        ${rollmessage}<br>
        <b>${actor.name}</b> атакует <b>${target.name}</b> по <b>${zoneLabel}</b> с помощью <b>${weapon}</b>.<br>
        Попытка урона: <b>${damageRollResult}</b> (${damageFormula}) (${damageTypes[damageType]})<br><br>
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
            attackerName: actor.name,
            zone,
            zoneLabel,
            zoneLabelRaw,
            amount: damageRollResult,
            damageType,
            difficulty: finalDifficulty,
            originalFormula: damageFormula,
            weapon
          }
        }
      }
    });
  }
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

function getRandomPhrase(arr) {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}


async function ThrowDice(difficulty, item) {
let modificator = 0;

try {
  const result = await Dialog.prompt({
    title: "Проверка броска",
    content: `
<b>${item}</b><br><br>
Сложность (ставить 0 если неизвестно):<br>
<input type="number" name="difficulty" value="${difficulty}" /><br><br>

Модификатор сложности:<br>
<input type="number" name="modificator" value="0" /><br><br>

Тип броска:<br>
<label><input type="radio" name="mode" value="normal" checked /> Обычный</label><br>
<label><input type="radio" name="mode" value="advantage" /> Преимущество</label><br>
<label><input type="radio" name="mode" value="disadvantage" /> Помеха</label><br><br>

Количество бросков:<br>
<input type="number" name="count" value="1" min="1" />
`,
    label: "Бросить",
    callback: html => {
      return {
        modificator: parseInt(html.find("input[name='modificator']").val() || 0),
        difficulty: parseInt(html.find("input[name='difficulty']").val() || 0),
        count: Math.max(1, parseInt(html.find("input[name='count']").val() || 1)),
        mode: html.find("input[name='mode']:checked").val()
      };
    }
  });
  const isUnknownDifficulty = result.difficulty < 1;
  modificator = result.modificator;
  difficulty = result.difficulty;

  const count = result.count;
  const mode = result.mode;
  let finalDiff = difficulty + modificator;
let modeMessage = `<b>Обычный бросок</b>`;
    let formula = "1d20";
  if (mode === "advantage") {
formula = "2d20kl";
modeMessage = `<b style="color:darkgreen">Преимущество</b>`;
}
  else if (mode === "disadvantage") {
formula = "2d20kh";
modeMessage = `<b style="color:darkred">Помеха</b>`;
}
  for (let i = 0; i < count; i++) {
    const roll = await new Roll(formula).roll();
    const result = roll.total;

    let message = "";
    if (isUnknownDifficulty) {
      finalDiff = "???";
      message = "???";
    } else {
      if (result === 1) message = "Крит. успех!";
      else if (result === 20) message = "Крит. неудача!";
      else if (result <= finalDiff) message = "Успех!";
      else message = "Неудача!";
    }


if (result.difficulty < 1) {
finalDiff = "???";
message = "???";
}

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker(),
      flavor: `
${modeMessage}<br>
<b>${item}</b> (бросок ${i + 1})<br>
Сложность: <b>${finalDiff}</b><br>
Результат: <b>${message}</b>
`.trim()
    });
  }

} catch {
  return;
}



}