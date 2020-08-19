
export let Actions = function (actions) {
    for (let i = 0; i < actions.length; i++) {
        let act = actions[i].split(',');
        if (act[0] === 'Dialog') {
            if (CheckFlag(act[2], act[3], act[4]) === true) return;
            new Dialog({
                title: act[0],
                content: act[1],
                buttons:
                {
                    ok: { label: "OK" }
                }
            }).render(true);
        } else {
            if (act[0] === 'Permission') {
                let action = act.shift();
                actions[i] = `${action},${game.user.id},${act.join()}`;
            }
            if (act[0] === 'HitTarget') {
                let action = act.shift();
                actions[i] = `${action},${canvas.tokens.controlled[0].id},${act.join()}`;
            }
            if (act[0] === 'MovePlayerToken') {
                let action = act.shift();
                actions[i] = `MoveToken,${canvas.tokens.controlled[0].name},${act.join()}`;
            }
            game.macros.entities.find(i => i.name === 'Actions').execute(...actions[i].split(','));
        }
    }
}

export let HitTarget = async function (targetid, actorTrapName, itemTrapName, flagScene, tokenid, type) {
    if (CheckFlag(flagScene, tokenid, type) === true) return;
    let token = canvas.tokens.get(targetid);
    let actor = token.actor;
    let tactor = game.actors.entities.find(a => a.name === actorTrapName)
    if (!tactor) return `/Whisper GM "DoTrap: Target token ${actorTrapName} not found"`
    let item = tactor.items.find(i => i.name === itemTrapName)
    if (!item) return `/Whisper GM "DoTrap: Item ${itemTrapName} not found"`
    let oldTargets = game.user.targets;
    game.user.targets = new Set();
    game.user.targets.add(token);
    Hooks.once("MinorQolRollComplete", () => {
        ChatMessage.create({
            user: ChatMessage.getWhisperRecipients("GM")[0],
            content: "restoring targets",
            whisper: ChatMessage.getWhisperRecipients("GM"),
            blind: true
        });
        MinorQOL.forceRollDamage = false;
        game.user.targets = oldTargets;
    })
    MinorQOL.forceRollDamage = true;
    await MinorQOL.doCombinedRoll({ actor, item, event, token })
}
export let MoveToken = async function (tokenName, xsquere, ysquere, flagScene, tokenid, type) {
    let newX = 0;
    let newY = 0;
    let g = canvas.scene.data.grid;
    if (CheckFlag(flagScene, tokenid, type) === true) return;
    if (typeof tokenName === 'object') {
        for (let t in tokenName) {
            let tokenActive = canvas.tokens.placeables.find(i => i.name === t);
            CanvasAnimation.terminateAnimation(`Token.${tokenActive.id}.animateMovement`);
            newX = (tokenActive.data.x + (g * parseInt(xsquere)));
            newY = (tokenActive.data.y + (g * parseInt(ysquere)));
            await tokenActive.update({ x: newX, y: newY })
        }
    } else {
        let tokenActive = canvas.tokens.placeables.find(i => i.name === tokenName);
        CanvasAnimation.terminateAnimation(`Token.${tokenActive.id}.animateMovement`);
        newX = (tokenActive.data.x + (g * parseInt(xsquere)));
        newY = (tokenActive.data.y + (g * parseInt(ysquere)));
        await tokenActive.update({ x: newX, y: newY })
    }
    await canvas.pan(newX, newY);
}

export let Permission = async function (userid, tokenName, nivel = 2, flagScene, tokenid, type) {
    if (CheckFlag(flagScene, tokenid, type) === true) return;

    let pactor = canvas.tokens.placeables.find(i => i.name === tokenName).actor;
    console.log(pactor);
    //let pactor = canvas.tokens.get(idtoken).actor;
    let newpermissions = duplicate(pactor.data.permission);
    newpermissions[`${userid}`] = nivel;
    const lootPermissions = new PermissionControl(pactor);
    lootPermissions._updateObject(event, newpermissions);
}

export let SetDoor = async function (idDoor, action = 'open', flagScene, tokenid, type) {
    if (CheckFlag(flagScene, tokenid, type) === true) return;

    if (action === 'open') {
        canvas.walls.get(idDoor).update({
            ds: 1
        });
    } else if (action === 'show') {
        canvas.walls.get(idDoor).update({
            ds: 0,
            door: 1
        });
    } else if (action === 'toggle') {
        let stat = (canvas.walls.get(idDoor).ds === 0) ? 1 : 0;
        canvas.walls.get(idDoor).update({
            ds: stat
        });
    } else {
        canvas.walls.get(idDoor).update({
            ds: 0
        });
    }
}

export let Talk = async function (tokenName, message, language, bubble = true, flagScene, tokenid, type) {
    if (CheckFlag(flagScene, tokenid, type) === true) return;
    let t = canvas.tokens.placeables.find(i => i.name === tokenName);
    let lang = (language !== undefined && language !== 'custom') ? language : 'common';
    canvas.tokens.selectObjects({});
    $(`#polyglot select`).val(`${lang}`);
    setTimeout(function () {
        ChatMessage.create({
            speaker: { token: t, actor: t.actor, scene: canvas.scene },
            content: `${message}`,
            type: CONST.CHAT_MESSAGE_TYPES.IC,
        }, { chatBubble: bubble });
    }, 2000);
}
export let PlaySound = async function (soundFile, extention, volume, playlist, stoptime, flagScene, tokenid, type) {
    if (CheckFlag(flagScene, tokenid, type) === true) return;
    let plist = (playlist !== undefined && playlist !== "") ? playlist : `AmbientTracks`;
    let ext = (extention === undefined || extention === "") ? `ogg` : extention;
    let vol = volume / 100;
    let src = `playlist-import/${plist}/${soundFile}.${ext}`;
    let sound = AudioHelper.play({ src: src, volume: vol, autoplay: true, loop: false }, true);
    if (stoptime !== undefined && stoptime !== "" && stoptime > 0) {
        setTimeout(function () {
            sound.stop();
        }, stoptime * 1000);
    }
}

export let PauseGame = async function (flagScene, tokenid, type) {
    if (CheckFlag(flagScene, tokenid, type) === true) return;
    if (game.paused == false)
        game.togglePause(true, true);
}

export let Hidden = function (idHidden, hidden = false) {
    let hhidden = (hidden !== false) ? true : false;
    try {
        canvas.tokens.get(idHidden).update({ "hidden": hhidden });
    } catch (error) { }
    try {
        canvas.drawings.get(idHidden).update({ "hidden": hhidden });
    } catch (error) { }
    try {
        canvas.tiles.get(idHidden).update({ "hidden": hhidden });
    } catch (error) { }
}

export let SetFlag = function (flagScene, tokenid, type = 'perPlayer') {
    let invalid = false;
    if (type === 'once') {
        /// Acontece uma vez por jogo e ativa com qualquer jogador.
        for (let auser of game.users) {
            invalid = auser.getFlag(`world`, `${flagScene}.${tokenid}`) ? auser.getFlag(`world`, `${flagScene}.${tokenid}`) : false;
            if (invalid !== false) return invalid;
        }
    } else if (type === 'perPlayer') {
        /// Acontece uma vez por jogo e ativa uma vez para cada personagem.
        invalid = game.user.getFlag(`world`, `${flagScene}.${tokenid}`) ? game.user.getFlag(`world`, `${flagScene}.${tokenid}`) : false;
    }
    if (invalid === false)
        game.user.setFlag(`world`, `${flagScene}.${tokenid}`, true);
    return invalid;
}

export let UnSetFlag = function (flagScene, tokenid, deep = false) {
    for (let u of game.users) {
        if (u.getFlag(`world`, `${flagScene}.${tokenid}`)) {
            //Remove Apenas o ID
            u.unsetFlag(`world`, `${flagScene}.-=${tokenid}`);
        }
        if (deep === true && u.getFlag(`world`, `${flagScene}`)) {
            u.unsetFlag(`world`, `${flagScene}`);
        }
    }
}

export let PassiveCheck = async function (dificult, sucessActions, failActions, flags) {
    let asucessActions = sucessActions.split('.');
    let afailActions = failActions.split('.');
    if (game.user.isGM === true) return;
    if (flags !== undefined && flags !== '' && game.user.isGM === false) {
        // Setar Flag
        SetFlag(...flags.split('.'));
    }
    let character = game.user.character;
    let skillName = GetSkillName('prc');
    let skillPasssive = character.data.data.skills['prc'].passive;
    if (skillPasssive >= parseInt(dificult)) {
        //Sucesso
        //Check();
        Actions(asucessActions);
        await ChatMessage.create({
            user: ChatMessage.getWhisperRecipients("GM")[0],
            content: `${character.name} passou em um teste de ${skillName[1]} passiva.`,
            speaker: ChatMessage.speaker,
            whisper: ChatMessage.getWhisperRecipients("GM"),
            blind: true
        });
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker(),
            flavor: `${skillName[1]} passiva`,
            content: "Parece que eu vi algo",
            type: CONST.CHAT_MESSAGE_TYPES.IC,
        }, { chatBubble: true });
    } else {
        //Falha
        Actions(afailActions);
        await ChatMessage.create({
            user: ChatMessage.getWhisperRecipients("GM")[0],
            content: `${character.name} falhou em um teste de ${skillName[1]} passiva.`,
            speaker: ChatMessage.speaker,
            whisper: ChatMessage.getWhisperRecipients("GM"),
            blind: true
        });
    }
}
export let Checks = async function (skill, dificult, sucessActions, failActions, flags) {
    if (game.user.isGM === true) return;
    let asucessActions = sucessActions.split('.');
    let afailActions = failActions.split('.');
    if (flags !== undefined && flags !== '') {
        // Setar Flag
        SetFlag(...flags.split('.'));
    }
    let character = game.user.character;
    if (Object.entries(game.dnd5e.config.skills).map(a => a[0]).includes(skill)) {
        character.rollSkill(skill).then((result) => {
            if (result.total >= dificult) {
                Actions(asucessActions);
            } else {
                Actions(afailActions);
            }
        });
    } else if (Object.entries(game.dnd5e.config.abilities).map(a => a[0]).includes(skill)) {
        character.rollAbilityTest(skill).then((result) => {
            if (result.total >= dificult) {
                Actions(asucessActions);
            } else {
                Actions(afailActions);
            }
        })
    }
}
///
/// dificult =  Str.Dex
/// doorKey = itemName
///
export let OpenDoor = async function (dificult, doorKey, sucessActions, failActions, flags){
    if (game.user.isGM === true) return;
    if (flags !== undefined && flags !== '') {
        // Setar Flag
        SetFlag(...flags.split('.'));
    }
    let asucessActions = sucessActions.split('.');
    let afailActions = failActions.split('.');
    let token = canvas.tokens.get(canvas.tokens.controlled[0].id);
    let actor = game.actors.entities.find(a => a.name === token.actor.name);
    let cd = dificult.split(".");
    let cdStr = (cd[0] !== undefined && cd[0] !== "") ? parseInt(cd[0]) : 0;
    let cdDex = (cd[1] !== undefined && cd[1] !== "") ? parseInt(cd[1]) : 0;
    let d = new Dialog({
        title: "Tentativa de Abrir Porta",
        content: "<p>A Porta está Trancada como você deseja abrir a porta?</p>",
        buttons: {
            one: {
                icon: '<i class="fas fa-fist-raised"></i>',
                label: "Força",
                callback: async () => {
                    await game.user.character.rollAbilityTest(`str`).then((result) => {
                        if (result.total >= cdStr) {
                            Actions(asucessActions);
                        } else {
                            Actions(afailActions);
                        }
                    })
                }
            },
            two: {
                icon: '<i class="fas fa-user-lock"></i>',
                label: "Ferramenta de ladrão",
                callback: async () => {
                    let item = actor.items.find(i => i.name === `Thieves’ Tools` || i.name === `Ferramenta de Ladino`);
                    console.log(item);
                    if (!item) return `/Whisper GM "O Item Thieves’ Tools nao foi encontrado"`;                    
                    await MinorQOL.doCombinedRoll({ actor, item, event, token }).then((result) => {
                        if (result.total >= cdDex) {
                            Actions(asucessActions);
                        } else {
                            Actions(afailActions);
                        }
                    })
                }
            },
            tree: {
                icon: '<i class="fas fa-key"></i>',
                label: "Chave",
                callback: () => {
                    if (doorKey !== undefined && doorKey !== "") {
                        let item = actor.items.find(i => i.name === `${doorKey}`);
                        if (doorKey !== null && item) {
                            Actions(asucessActions);
                        } else {
                            Actions(afailActions);
                        }
                    } else { return `Não Tenho a Chave`; }
                }
            }
        },
        default: "one",
        close: () => console.log("This always is logged no matter which option is chosen")
    });
    d.render(true);
}

function GetSkillName(skill) {
    return Object.entries(game.dnd5e.config.skills).find(i => i[0] === skill);
}

function CheckFlag(flagScene, tokenid, type) {
    if (flagScene !== undefined && flagScene !== '') {
        let set = SetFlag(flagScene, tokenid, type);
        if (set !== false) return true;
        return false;
    }
    return false;
}