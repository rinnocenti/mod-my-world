export let Checks = async function (skill, dificult, sucessActions, failActions, flags) {
    if (game.user.isGM === true) return;
    if (flags != undefined) {
        let aflags = flags.split('.');
        if (CheckFlag(aflags[0], aflags[1], aflags[2]) === true) return;
    } 
    let asucessActions = sucessActions.split('.');
    let afailActions = failActions.split('.');
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

export let PoolToken = function (controlid, tokenFlag, flags) {
    if (flags != undefined) {
        let aflags = flags.split('.');
        if (CheckFlag(aflags[0], aflags[1], aflags[2]) === true) return;
    }
    if (!game.scenes.active.getFlag(`world`, `${tokenFlag}.${controlid}`)) {
        let sceneflag = [`SetSceneFlag,${tokenFlag}`];
        Actions(sceneflag);
        AlertWhispGM(game.user.character.name, sceneflag);
    }
}

export let PressTable = function (controlid, tokenid, chance, sucessActions, failActions, flags) {
    if (flags != undefined) {
        let aflags = flags.split('.');
        if (CheckFlag(aflags[0], aflags[1], aflags[2]) === true) return;
    }
    let asucessActions = sucessActions.split('.');
    let afailActions = failActions.split('.');
    // Count tokens
    if (!game.scenes.active.getFlag(`world`, `${tokenid}.${controlid}`)) {
        let sceneflag = [`SetSceneFlag,${tokenid}`];
        Actions(sceneflag);
    }
    let persons = game.scenes.active.getFlag(`world`, `${tokenid}`);
    let count = 0;
    if (persons === undefined) persons = new Object();
    if (!persons.hasOwnProperty(controlid)) persons[controlid] = true;
    for (var key in persons) { count++; }
    let r = new Roll(`${chance}`);
    r.roll();
    AlertWhispGM(game.user.character.name, r.result);
    //ui.notifications.warn(r.result);
    if (r.result > count) {
        //ui.notifications.info(asucessActions);
        Actions(asucessActions);
    } else {
        //ui.notifications.info(afailActions);
        Actions(afailActions);
    }
    //ui.notifications.info(count);
}

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
            if (act[0] === 'HitTarget' || act[0] === 'SetSceneFlag') {
                let action = act.shift();
                actions[i] = `${action},${canvas.tokens.controlled[0].id},${act.join()}`;
            }
            if (act[0] === 'PlayerTalk') {
                let action = act.shift();
                actions[i] = `Talk,${canvas.tokens.controlled[0].name},${act.join()}`;
            }
            if (act[0] === 'MovePlayerToken') {
                let action = act.shift();
                actions[i] = `MoveToken,${canvas.tokens.controlled[0].name},${act.join()}`;
            }
            if (act[0] === 'SetFlag') {
                let action = act.shift();
                actions[i] = `${action},${game.user.id},${act.join()}`;
            }
            console.log(actions[i]);
            game.macros.entities.find(i => i.name === 'Actions').execute(...actions[i].split(','));
        }
    }
}

export let PassiveCheck = async function (dificult, sucessActions, failActions, flags) {
    let asucessActions = sucessActions.split('.');
    let afailActions = failActions.split('.');
    let aflags = flags.split('.');
    if (game.user.isGM === true || CheckFlag(aflags[0], aflags[1], aflags[2]) === true) return;
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

export let OpenDoor = async function (dificult, sucessActions, failActions, doorKey, flags) {
    if (game.user.isGM === true) return;
    if (flags !== undefined && flags !== '') {
        // Setar Flag
        CheckSetFlag(...flags.split('.'));
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
                        //console.log(result.total);
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
                    //console.log(item);
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

export let HitTarget = async function (targetid, actorTrapName, itemTrapName, tokenTrapName, flagScene, tokenid, type) {
    if (CheckFlag(flagScene, tokenid, type) === true) return;
    let token = canvas.tokens.get(targetid);
    let tactor = game.actors.entities.find(a => a.name === actorTrapName);
    if (!tactor) return `/Whisper GM "DoTrap: Target token ${actorTrapName} not found"`;
    let item = tactor.items.find(i => i.name === itemTrapName);
    if (!item) return `/Whisper GM "DoTrap: Item ${itemTrapName} not found"`;
    let trapToken = canvas.tokens.placeables.find(t => t.name === tokenTrapName);
    new MidiQOL.TrapWorkflow(tactor, item, [token], trapToken.center);
}

export let HitAllTargets = async function (sceneFlag, actorTrapName, itemTrapName, tokenTrapName, flagScene, tokenid, type) {
    if (CheckFlag(flagScene, tokenid, type) === true) return;
    let tactor = game.actors.entities.find(a => a.name === actorTrapName);
    if (!tactor) return `/Whisper GM "DoTrap: Target token ${actorTrapName} not found"`;
    let item = tactor.items.find(i => i.name === itemTrapName);
    if (!item) return `/Whisper GM "DoTrap: Item ${itemTrapName} not found"`;
    let trapToken = canvas.tokens.placeables.find(t => t.name === tokenTrapName);

    let pool = game.scenes.active.getFlag(`world`, `${sceneFlag}`);
    let tokens = [];
    for (let idt in pool) {
        let tk = canvas.tokens.placeables.find(t => t.id === idt);
        tokens.push(tk);
    }
    new MidiQOL.TrapWorkflow(tactor, item, tokens, trapToken.center);
}

export let MoveAllTokens = async function (sceneFlag, xsquere, ysquere, flagScene, tokenid, type) {
    if (CheckFlag(flagScene, tokenid, type) === true) return;
    let tokens = game.scenes.active.getFlag(`world`, `${sceneFlag}`);
    for (let idt in tokens) {
        let tokenActive = canvas.tokens.placeables.find(i => i.id === idt);
        MoveToken(tokenActive.name, xsquere, ysquere);
    }
}

export let MoveToken = async function (tokenName, xsquere, ysquere, flagScene, tokenid, type) {
    if (CheckFlag(flagScene, tokenid, type) === true) return;
    let newX = 0;
    let newY = 0;
    let g = canvas.scene.data.grid;
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

export let Permission = async function (playerid, actorName, nivel = 2, flagScene, tokenid, type) {
    if (CheckFlag(flagScene, tokenid, type) === true) return;
    console.log(actorName);
    if (typeof nivel !== 'number') nivel = parseInt(nivel);
    let actor = game.actors.entities.find(a => a.name === actorName);
    let newpermissions = duplicate(actor.data.permission);
    newpermissions[`${playerid}`] = nivel;
    let lootPermissions = new PermissionControl(actor);
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

export let Talk = async function (tokenName, message, language = 'default', bubble = true, flagScene, tokenid, type) {
    if (CheckFlag(flagScene, tokenid, type) === true) return;
    let t = canvas.tokens.placeables.find(i => i.name === tokenName);
    let oldLang = $(`#polyglot select`).val();
    if (language !== 'default') {
        canvas.tokens.selectObjects({});
        $(`#polyglot select`).val(`${language}`);
    }    
    setTimeout(function () {
        ChatMessage.create({
            speaker: { token: t, actor: t.actor, scene: canvas.scene },
            content: `${message}`,
            type: CONST.CHAT_MESSAGE_TYPES.IC,
            blind: false
        }, { chatBubble: bubble });
        $(`#polyglot select`).val(`${oldLang}`);
    }, 1000);
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
    if (game.paused === false)
        game.togglePause(true, true);
}

export let Hidden = function (idHidden, hidden = false) {
    let hhidden = (hidden !== `false`) ? true : false;
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

export let CheckSetFlag = function (flagScene, tokenid, type = 'perPlayer') {
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
    if (typeof deep !== 'boolean')
        deep = (deep !== 'false') ? true : false;
    for (let u of game.users) {
        u.unsetFlag(`world`, `${flagScene}.-=${tokenid}`);
        
        if (deep === true && u.getFlag(`world`, `${flagScene}`)) {
           // ui.notifications.info('DEEP');
            u.unsetFlag(`world`, `${flagScene}`);
        }
    }
}
export let SetFlag = function (userid, flagScene, tokenid, type = 'perPlayer') {
    if (type === 'perPlayer') {
        let auser = game.users.get(userid);
        auser.setFlag(`world`, `${flagScene}.${tokenid}`, true);
    }else {
        for (let auser of game.users) {
            auser.setFlag(`world`, `${flagScene}.${tokenid}`, true);
        }
    }
}
export let SetSceneFlag = function (controlledid, tokenid, remove) {
    if (remove !== undefined) {
        if (game.scenes.active.getFlag(`world`, `${tokenid}.${controlledid}`))
            game.scenes.active.unsetFlag(`world`, `${tokenid}.-=${controlledid}`);
    } else {
        game.scenes.active.setFlag(`world`, `${tokenid}.${controlledid}`, true);
    }
}

function GetSkillName(skill) {
    return Object.entries(game.dnd5e.config.skills).find(i => i[0] === skill);
}

function CheckFlag(flagScene, tokenid, type) {
    if (flagScene !== undefined && flagScene !== '') {
        let set = CheckSetFlag(flagScene, tokenid, type);
        if (set !== false) return true;
        return false;
    }
    return false;
}
function ChangeName(idTrigger, newtext) {
    try {
        let entidade = canvas.drawings.get(idTrigger);
        entidade.update({ text: `${newtext}`});
    } catch { }
    try {
        let entidade = canvas.tokens.get(idTrigger);
        entidade.update({ name: `${newtext}`});
    } catch { }
}
function AlertWhispGM(charName, ckTest) {
    ChatMessage.create({
        user: ChatMessage.getWhisperRecipients("GM")[0],
        content: `${charName} - check:  ${ckTest}.`,
        speaker: ChatMessage.speaker,
        whisper: ChatMessage.getWhisperRecipients("GM"),
        blind: true
    });
}