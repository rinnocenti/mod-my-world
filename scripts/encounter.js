const EncounterSceneFlag = "Encounters";
/// Registra um encntro na cena atual
export let RegisterEncounter = function (minutes) {
    RemoverEncouter();
    //Registra um novo table
    let gameTimeid = game.Gametime.doEvery({ minutes: minutes }, CheckEncounter);
    onDisableScene(gameTimeid);
    game.user.setFlag(`world`, `${EncounterSceneFlag}.${gameTimeid}`, true);
    game.Gametime.queue();
}

export let RollEncounter = async function () {
    $(`.roll-type-select select`).val(`gmroll`);
    let hour = game.Gametime.DTNow().hours;
    let tableName = "Encounter " + game.scenes.active.name;
    let table = game.tables.entities.find(t => t.name === tableName);
    if (table == null) {
        // Check if Table with day night exist
        tableName += (hour >= 19 || hour < 7) ? " Night" : " Day";
        table = game.tables.entities.find(t => t.name === tableName);
    }
    if (table == null) {
        ui.notifications.error("Não existe tabela de encontro para este mapa: " + tableName);
    } else {
        ui.notifications.info(`Rolar Tabela de Encontro ${tableName}`);
        await game.betterTables.betterTableRoll(table);
    }
    await $(`.roll-type-select select`).val(`roll`);
}

function RemoverEncouter() {
    let invalid = false;
    // Checa se houve agendamento na scena.
    invalid = game.scenes.active.getFlag(`world`, `${EncounterSceneFlag}`) ? game.scenes.active.getFlag(`world`, `${EncounterSceneFlag}`) : false;
    if (invalid !== false) {
        // Se existe remover todos os agendamentos prévios.
        for (let idt in invalid) {
            game.Gametime.clearTimeout(idt);
        }
        game.scenes.active.unsetFlag(`world`, `${EncounterSceneFlag}`);
    }
}

function CheckEncounter() {
    let d = new Dialog({
        title: "Lembrete de Encontro Aleatório",
        content: `<p>Esta cena possui encontros aleatórios programados deseja rolar um encontro?</p>`,
        buttons: {
            one: {
                icon: '<i class="fas fa-dice-d20"></i>',
                label: "Rolar Encontro",
                callback: async () => {
                    if (game.paused === false)
                        game.togglePause(true, true);
                    await RollEncounter();
                }
            },
            two: {
                icon: '<i class="fas fa-forward"></i>',
                label: "Não desta vez",
                callback: async () => {
                    console.log("Encontro Ignorado")
                }
            },
            tree: {
                icon: '<i class="far fa-window-close"></i>',
                label: "Remover Agendamento",
                callback: async () => {
                    RemoverEncouter();
                }
            }
        },
        default: "two",
        close: () => console.log("This always is logged no matter which option is chosen")
    });
    d.render(true);
}

function onDisableScene(gameTimeid) {
    Hooks.once("preUpdateScene", () => {
        //ui.notifications.info("A Agora Descarregou");
        game.Gametime.clearTimeout(gameTimeid);
    });
}