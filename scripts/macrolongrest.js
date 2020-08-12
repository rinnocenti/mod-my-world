/*
 * Tipos de descanço longo
 * 0 = Acampamento perigoso/improvisado
 * 1 = Acampamento seguro
 * 2 = Quarto Improvisado/ Acampamento alugado
 * 3 = Quarto Compartilhado
 * 4 = Quarto Individual
 * 5 = Quarto de Luxo
 */

window.Innocenti = {};
window.Innocenti.LongRest = async function (category = 0) {
    if (canvas.tokens.controlled.length === 0)
        return ui.notifications.error("select a token");
    for (let token of canvas.tokens.controlled) {
        const data = token.actor.data.data;
        // promessa de um dialogo..
        let dialog = false; ////////////////////////////////////////////////////////// <-----------------------
        let newDay = false;
        if (dialog) {
            try {
                newDay = await LongRestDialog(token.actor);
            } catch (err) {
                return;
            }
        }
        // Recover hit points to full, and eliminate any existing temporary HP
        const updateData = {
            "data.attributes.hp.temp": 0,
            "data.attributes.hp.tempmax": 0
        }
        if (category <= 1) {
            let halfhp = Math.round(data.attributes.hp.max / 2);
            let conmod = (data.abilities.con.value - 10) / 2;
            updateData["data.attributes.hp.value"] = (data.attributes.hp.value < halfhp) ? halfhp : data.attributes.hp.value + ((data.abilities.con.value - 10) / 2);
        } else {
            updateData["data.attributes.hp.value"] = data.attributes.hp.max;
        }
        //const dhp = data.attributes.hp.max - data.attributes.hp.value;
        // Recover character resources
        for (let [k, r] of Object.entries(data.resources)) {
            if (r.max && (r.sr || r.lr)) {
                updateData[`data.resources.${k}.value`] = r.max;
            }
        }
        // Recover spell slots
        for (let [k, v] of Object.entries(data.spells)) {
            if (!v.max && !v.override) continue;
            updateData[`data.spells.${k}.value`] = v.override || v.max;
        }

        // Recover pact slots.
        const pact = data.spells.pact;
        updateData['data.spells.pact.value'] = pact.override || pact.max;
        let recoverHD = 1;
        // Determine the number of hit dice which may be recovered
        if (category <= 1) {
            recoverHD = data.attributes.hd;
        } else if (category === 2 || category === 3) {
            recoverHD = 1;
        } else if (category === 4) {
            recoverHD = Math.max(Math.floor(data.details.level / 2), 1);
        } else {
            recoverHD = data.details.level;
        }
        //recover Exhaustion
        //ui.notifications.info(data.attributes.exhaustion);
        updateData["data.attributes.exhaustion"] = (data.attributes.exhaustion > 0) ? data.attributes.exhaustion - 1 : 0;

        let dhd = 0;
        // Sort classes which can recover HD, assuming players prefer recovering larger HD first.
        const updateItems = token.actor.items.filter(item => item.data.type === "class").sort((a, b) => {
            let da = parseInt(a.data.data.hitDice.slice(1)) || 0;
            let db = parseInt(b.data.data.hitDice.slice(1)) || 0;
            return db - da;
        }).reduce((updates, item) => {
            const d = item.data.data;
            if ((recoverHD > 0) && (d.hitDiceUsed > 0)) {
                let delta = Math.min(d.hitDiceUsed || 0, recoverHD);
                recoverHD -= delta;
                dhd += delta;
                updates.push({ _id: item.id, "data.hitDiceUsed": d.hitDiceUsed - delta });
            }
            return updates;
        }, []);

        // Iterate over owned items, restoring uses per day and recovering Hit Dice
        const recovery = newDay ? ["sr", "lr", "day"] : ["sr", "lr"];
        for (let item of token.actor.items) {
            const d = item.data.data;
            if (d.uses && recovery.includes(d.uses.per)) {
                updateItems.push({ _id: item.id, "data.uses.value": d.uses.max });
            }
            else if (d.recharge && d.recharge.value) {
                updateItems.push({ _id: item.id, "data.recharge.charged": true });
            }
        }
        // Perform the updates
        await token.actor.update(updateData);
        if (updateItems.length) await token.actor.updateEmbeddedEntity("OwnedItem", updateItems);
    }
    return;
}
async function LongRestDialog({ actor } = {}) {
    return new Promise((resolve, reject) => {
        const dlg = new this(actor, {
            title: "Long Rest",
            buttons: {
                rest: {
                    icon: '<i class="fas fa-bed"></i>',
                    label: "Rest",
                    callback: html => {
                        let newDay = false;
                        if (game.settings.get("dnd5e", "restVariant") === "normal")
                            newDay = html.find('input[name="newDay"]')[0].checked;
                        else if (game.settings.get("dnd5e", "restVariant") === "gritty")
                            newDay = true;
                        resolve(newDay);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: reject
                }
            },
            default: 'rest',
            close: reject
        });
        dlg.render(true);
    });
}

window.Innocenti.Check = function (condition, pass, trigger = null) {
    let condition_arr = condition.split('.');
    let pass_arr = pass.split('.');
    //console.log(condition_arr);
    //console.log(pass_arr);
    for (let i = 0; i < condition_arr.length; i++) {
        switch (condition_arr[i]) {
            case "Reveal":
                game.macros.entities.find(i => i.name === "Reveal").execute(pass_arr[i]);
                break;
            case "Hidde":
                game.macros.entities.find(i => i.name === "Hidde").execute(pass_arr[i]);
                break;
            case "Permission":
                game.macros.entities.find(i => i.name === "Permission").execute(pass_arr[i], game.user.id);
                break;
            case "Dialog":
                game.macros.entities.find(i => i.name === "Dialog").execute(pass_arr[i], (pass_arr[i].slice(0, -1) + "D"), "each");
                break;
            case "PauseGame":
                game.macros.entities.find(i => i.name === "PauseGame").execute(pass_arr[i]);
                break;
            case "HitTarget":
                game.macros.entities.find(i => i.name === "HitTarget").execute(...pass_arr[i].split(','));
                break;
            case "Unlock":
                game.macros.entities.find(i => i.name === "Unlock").execute(...pass_arr[i].split(','));
                break;
            case "Bubble":
                game.macros.entities.find(i => i.name === "Bubble").execute(...pass_arr[i].split(','));
                break;
            case "ResetTrigger":
                game.macros.entities.find(i => i.name === "ResetTrigger").execute(trigger);
                break;
            case "PlaySound":
                game.macros.entities.find(i => i.name === "PlaySound").execute(...pass_arr[i].split(','));
                break;
            case "Move":
                game.macros.entities.find(i => i.name === "Move").execute(...pass_arr[i].split(','));
                break;
            case "Teleport":
                game.macros.entities.find(i => i.name === "TeleportToToken").execute(...pass_arr[i].split(','));
                break;
            case "MovePlayer":
                let tid = canvas.tokens.controlled[0].id;
                let newarr = `${tid},${pass_arr[i]}`;
                //console.log(pass_arr);
                game.macros.entities.find(i => i.name === "Move").execute(...newarr.split(','));
                break;
            case "ChatMessager":
                game.macros.entities.find(i => i.name === "ChatMessager").execute(pass_arr[i]);
                break;
            default:
        }
    }
}

window.Innocenti.ResetTrigger = function (opt) {
    let opts = opt.split('.');
    let uniquekey = opts[0] + opts[1];
    if (opts[2] !== undefined) {
        let t_rest = parseInt(opts[2]);
        setTimeout(function () {
            for (let auser of game.users) {
                if (auser.getFlag(`world`, `${uniquekey}`))
                    auser.unsetFlag(`world`, `${uniquekey}`);
            }            
            ui.notifications.info("Removeu!");
        }, (t_rest * 1000))
    }
}

window.Innocenti.TriggerShot = function (opt) {
    let opts = opt.split('.');
    let escope = opts[1];
    let uniquekey = opts[0] + opts[1];
    let invalid = false;

    if (escope === 'once') {
        /// Acontece uma vez por jogo e ativa com qualquer jogador.
        for (let auser of game.users) {
            invalid = auser.getFlag(`world`, `${uniquekey}`) ? auser.getFlag(`world`, `${uniquekey}`) : false;
            if (invalid !== false) return invalid;
        }
        if (invalid === false)
            game.user.setFlag(`world`, `${uniquekey}`, true);
    } else if (escope === "perPlayer") {
        /// Acontece uma vez por jogo e ativa uma vez para cada personagem.
        invalid = game.user.getFlag(`world`, `${uniquekey}`) ? game.user.getFlag(`world`, `${uniquekey}`) : false;
        if (invalid === false)
            game.user.setFlag(`world`, `${uniquekey}`, true);
    }
    return invalid;
}