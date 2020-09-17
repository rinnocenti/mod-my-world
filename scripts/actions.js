import { SetTriggerFlag } from './SetTriggerFlag.js';
import { addTMFX, removeTMFX } from './tmpx.js';
export class SetTrigger {
    constructor(userid, tokenid) {
        this.user = game.users.get(userid);
        this.token = canvas.tokens.get(tokenid);
        this.actor = game.actors.entities.find(a => a.name === this.token.actor.name);
        console.log(this);
    }
    CheckFlag(flags) {
        if (flags !== undefined) {
            let flag = new SetTriggerFlag(this.user.id, this.token.id, ...flags.split(','));
            if (flag.GetFlag()) return true;
            flag.SetFlag();
        }
        return false;
    }
    TargetTokens(targetIdOrName) {
        this.targets = [];
        for (let i = 0; i < targetIdOrName.length; i++) {
            if (targetIdOrName[i].toLowerCase() === 'self' || targetIdOrName[i].toLowerCase() === 'player') {
                this.targets.push(this.token);
            } else if (game.scenes.active.getFlag(`world`, `${targetIdOrName[i]}`)) {
                try {
                    let pool = game.scenes.active.getFlag(`world`, `${targetIdOrName[i]}`);
                    for (let idt in pool) {
                        let tk = canvas.tokens.placeables.find(t => t.id === idt);
                        if (tk)
                            this.targets.push(tk);
                    }
                } catch (e) { }
            } else {
                let t = canvas.tokens.placeables.find(a => a.name === targetIdOrName[i]) || targetIdOrName[i];
                this.targets.push(t);
            }
        }
    }
    async ExecuteActions(actions, targets, param) {
        let multparam = (param.length < targets.length) ? Array(targets.length).fill(param[0]) : param;
        console.log(this);
        switch (actions) {
            case 'HitTarget':
                await this[actions](this.targets, ...multparam);
                break;
            case 'PlaySound':
            case 'PlayTrack':
            case 'ResetFlag':
            case 'ResetMyFlag':
            case 'UnSetSceneFlag':
                await this[actions](...param);
                break;
            case 'None':
            case '':
                break;
            default:
                await this[actions](this.targets, multparam);
        }
    }
    async GMCheck(check) {
        let checkActions = check.split('; ');
        for (let i = 0; i < checkActions.length; i++) {
            let act = checkActions[i].split('.');
            this.action = act.shift();
            let actionParm = act.shift();
            let targetName = act[0];
            this.args = (actionParm !== undefined && actionParm !== '') ? actionParm.split(';') : [actionParm];
            if (targetName !== undefined && targetName.toLowerCase() !== 'none' && targetName !== '')
                this.TargetTokens(targetName.split(','));
            else
                this.targets = [this.token];
            await this.ExecuteActions(this.action, this.targets, this.args);
        }
    }
    async GMacro(check) {
        game.macros.entities.find(i => i.name === 'GMCheck').execute(this.user.id, this.token.id, check);
    }
    async ChangeLebel(target, newLabel) {
        if (target === undefined) return ui.notifications.error("Não há um alvo valido");
        //TODO: Mais de um com o mesmo nome corregir
        for (let i = 0; i < target.length; i++) {
            try {
                canvas.drawings.get(target[i]).update({ "text": newLabel });
            } catch (error) { }
            try {
                let dr = canvas.drawings.placeables.find(a => a.data.text === target[i]);
                if (dr)
                    dr.update({ "text": newLabel });
            } catch (error) { }
        }
    }
    async ChangeImage(target, newimage) {
        if (target === undefined) return ui.notifications.error("Não há um alvo valido");
        for (let i = 0; i < target.length; i++) {
            try {
                let baseurl = `uploads-img/${newimage[i]}.png`;
                if (!isUrlFound(`${baseurl}.webp`))
                    if (!isUrlFound(baseurl)) return;
                    else
                        baseurl = baseurl.concat('.webp');
                target[i].update({ "img": baseurl });
            } catch (e) { }
            try {
                let baseurl = `assets/art/${newimage[i]}.png`;
                if (!isUrlFound(`${baseurl}.webp`))
                    if (!isUrlFound(baseurl)) return;
                    else
                        baseurl = baseurl.concat('.webp');
                canvas.tiles.get(target[i]).update({ "img": baseurl });
            } catch (e) { }
        }
    }
    async Hidden(target, hidden) {
        if (target === undefined) return ui.notifications.error("Não há um alvo valido");
        for (let i = 0; i < target.length; i++) {
            let hhidden = (hidden[i] === false || hidden[i] === 'false') ? false : true;
            try {
                target[i].update({ "hidden": hhidden });
            } catch (error) { }
            try {
                canvas.drawings.get(target[i]).update({ "hidden": hhidden });
            } catch (error) { }
            try {
                canvas.tiles.get(target[i]).update({ "hidden": hhidden });
            } catch (error) { }
        }
    }
    async HitTarget(targets, actorTrapName, itemTrapName, tokenTrap) {
        if (targets === undefined) return ui.notifications.error("Não há um alvo valido");
        let actorTrap = (typeof actorTrapName === 'string') ? game.actors.entities.find(t => t.name === actorTrapName) : actorTrapName;
        let item = actorTrap.items.find(t => t.name === itemTrapName);
        if (tokenTrap !== undefined)
            tokenTrap = canvas.tokens.placeables.find(a => a.name === tokenTrap);
        else
            tokenTrap = this.token;
        new MidiQOL.TrapWorkflow(actorTrap, item, targets, tokenTrap.center);
    }
    async ItemGive(targets, itemName) {
        if (targets === undefined) return ui.notifications.error("Não há um alvo valido");
        if (this.user.isGM === true) return;
        for (let i = 0; i < targets.length; i++) {
            let item;
            let actor = targets[i].actor;

            let collection = itemName[i].split(',');
            if (collection.length > 1) {
                let comp = `${collection[0]}.${collection[1]}`;
                let itemId = await GetItemIdCompendium(comp, collection[2]);
                try {
                    item = await targets[i].actor.importItemFromCollection(comp, `${itemId._id}`);
                } catch (error) { }
            } else {
                item = await game.items.getName(itemName[i]);
            }
            if (item !== undefined) {
                await actor.createEmbeddedEntity("OwnedItem", item);
                let message = `
            <div class="dnd5e chat-card item-card" data-actor-id="${actor._id}" data-item-id="${item._id}">
                <header class="card-header flexrow">
                    <img src="${item.img}" title="${item.name}" width="36" height="36">
                    <h3 class="item-name">${item.name}</h3>
                </header>
            </div>
            `;
                await setTimeout(function () {
                    canvas.tokens.selectObjects({});
                    ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ token: targets[i], actor: targets[i].actor, scene: canvas.scene }),
                        content: message,
                        flavor: `Um item foi adicionado ao seu inventário`,
                        type: CONST.CHAT_MESSAGE_TYPES.IC,
                        blind: false
                    }, { chatBubble: false });
                }, 500);
            }            
            
        }
    }
    async ItemRemove(targets, itemName) {
        if (targets === undefined) return ui.notifications.error("Não há um alvo valido");
        if (this.user.isGM === true) return;
        for (let i = 0; i < targets.length; i++) {
            let actor = targets[i].actor;
            let item = actor.items.find(a => a.name === itemName[i]);
            let itemEb = actor.getEmbeddedEntity("OwnedItem", item.id);
            if (itemEb.data.quantity > 1) {
                let update = { _id: item.id, "data.quantity": itemEb.data.quantity - 1 };
                await actor.updateEmbeddedEntity("OwnedItem", update);
            } else {
                await actor.items.find(a => a.name === itemName[i]).delete();
            }
            let message = `
            <div class="dnd5e chat-card item-card" data-actor-id="${actor._id}" data-item-id="${item._id}">
                <header class="card-header flexrow">
                    <img src="${item.img}" title="${item.name}" width="36" height="36">
                    <h3 class="item-name">${item.name}</h3>
                </header>
            </div>
            `;
            await setTimeout(function () {
                canvas.tokens.selectObjects({});
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ token: targets[i], actor: targets[i].actor, scene: canvas.scene }),
                    content: message,
                    flavor: `Um item foi removido do seu inventário`,
                    type: CONST.CHAT_MESSAGE_TYPES.IC,
                    blind: false
                }, { chatBubble: false });
            }, 500);
        }

    }
    async MoveToken(target, sqmove) {
        let newX = 0;
        let newY = 0;
        let g = canvas.scene.data.grid;
        for (let i = 0; i < target.length; i++) {
            if (typeof target[i] === 'string') return;
            CanvasAnimation.terminateAnimation(`Token.${target[i].id}.animateMovement`);
            let squeres = sqmove[i].split(',');
            newX = (target[i].data.x + (g * parseInt(squeres[0])));
            newY = (target[i].data.y + (g * parseInt(squeres[1])));
            await target[i].update({ x: newX, y: newY });
        }
        await canvas.pan(newX, newY);
    }
    async MoveRelToken(target, sqmove) {
        let newX = 0;
        let newY = 0;
        let g = canvas.scene.data.grid;
        for (let i = 0; i < target.length; i++) {
            if (typeof target[i] === 'string') return;
            CanvasAnimation.terminateAnimation(`Token.${target[i].id}.animateMovement`);
            let face = GetDirFace(target[i]);
            if (!face) ui.notifications.error("Precisa do About-face instalado");
            let squeres = sqmove[i].split(',');
            squeres[0] = (face == 90) ? -1 * squeres[0] : squeres[0];
            squeres[1] = (face == 180) ? -1 * squeres[1] : squeres[1];
            newX = (target[i].data.x + (g * parseInt(squeres[0])));
            newY = (target[i].data.y + (g * parseInt(squeres[1])));
            await target[i].update({ x: newX, y: newY });
        }
        await canvas.pan(newX, newY);
    }
    async PauseGame() {
        if (game.paused === false)
            game.togglePause(true, true);
    }
    async Permission(target, nivel = 'observer') {
        for (let i = 0; i < target.length; i++) {
            if (this.user.isGM === true) return;
            if (target[i] === undefined) return ui.notifications.error(`${target[i]} não é um alvo valido`);
            let permission = (nivel[i] === 'owner') ? 3 : (nivel[i] === 'observer') ? 2 : (nivel[i] === 'limited') ? 1 : 0;
            let actor = game.actors.entities.find(a => a.name === target[i].actor.name);
            if (!actor) return ui.notifications.error(`Permission: Actor of ${target[i].name} not found`);
            let newpermissions = duplicate(actor.data.permission);
            newpermissions[`${this.user.id}`] = permission;
            let permissions = new PermissionControl(actor);
            permissions._updateObject(event, newpermissions);
        }
    }
    async PlaySound(soundFile, volume, extention = `ogg`, playlist = `playlist-import/AmbientTracks`, stoptime) {
        let vol = volume / 100;
        let src = `${playlist}/${soundFile}.${extention}`;
        let sound = AudioHelper.play({ src: src, volume: vol, autoplay: true, loop: false }, true);
        if (stoptime !== undefined && stoptime !== "" && stoptime > 0) {
            setTimeout(function () {
                sound.stop();
            }, stoptime * 1000);
        }
    }
    async PlayTrack(playlist, soundFile, stop = false) {
        if (stop) {
            var playl = game.playlists.find(track => track.data.name === soundFile);
            if (playl.playing) {
                playl.stopAll();
            }
        }
        else
            FurnacePlaylistQoL.PlaySound(playlist, soundFile);
    }
    async ResetMyFlag(flagName, range, trigger) {
        let flag = new SetTriggerFlag(this.user.id, this.token.id, flagName, range, trigger);
        flag.ResetFlag();
    }
    async ResetFlag(flagName, range, trigger) {
        let flag = new SetTriggerFlag(this.user.id, this.token.id, flagName, range, trigger);
        flag.ResetAllFlag();
    }
    async SetDoor(target, actions) {
        for (let i = 0; i < target.length; i++) {
            if (actions[i] === 'open') await canvas.walls.get(target[i]).update({ ds: 1 });
            if (actions[i] === 'close') await canvas.walls.get(target[i]).update({ ds: 0 });
            if (actions[i] === 'show') await canvas.walls.get(target[i]).update({ door: 1 });
            if (actions[i] === 'toggle') {
                let stat = (canvas.walls.get(target[i]).ds === 0) ? 1 : 0;
                await canvas.walls.get(target[i]).update({ ds: stat });
            }
        }
    }
    async Talk(target, message, language = 'common', bubble = true) {
        let oldLang = $(`#polyglot select`).val();
        canvas.tokens.selectObjects({});
        for (let i = 0; i < target.length; i++) {
            let msg = message[i].split(',');
            if (msg.length > 1) {
                message[i] = msg[0];
                language = msg[1] || 'common';
                bubble = msg[2] || true;
            }
            let lang = (language !== undefined && language !== '' && language !== 'custom') ? language : 'common';
            let bub = (bubble !== 'false') ? true : false;

            await setTimeout(function () {
                canvas.tokens.selectObjects({});
                $(`#polyglot select`).val(`${lang}`);
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ token: target[i], actor: target[i].actor, scene: canvas.scene }),
                    content: `${message[i]}`,
                    type: CONST.CHAT_MESSAGE_TYPES.IC,
                    blind: false
                }, { chatBubble: bub });
                $(`#polyglot select`).val(`${oldLang}`);
            }, 500);

        }
    }
    async TMFX(target, filterid) {
        let tile = false;
        let objtile = [];
        for (let i = 0; i < target.length; i++) {
            if (typeof target[i] === 'string') {
                tile = (canvas.tiles.get(target[i])) ? canvas.tiles.get(target[i]) : (canvas.drawings.get(target[i])) ? canvas.drawings.get(target[i]) : false;
                if (tile === false) return;
            } else {
                tile = target[i];
            }
            addTMFX(tile, filterid[i]);
            objtile.push({ tile: tile, filter: filterid[i] });
        }
        await setTimeout(await function () {

            for (let i = 0; i < objtile.length; i++) {
                removeTMFX(objtile[i].tile, objtile[i].filter);
            }
        }, 4 * 1000);
    }
    async UnSetSceneFlag(tokenName, flagName, deep = false, scopeFlag) {
        scopeFlag = (scopeFlag === undefined) ? SCOPE_FLAG : scopeFlag;
        deep = (deep !== 'false') ? true : false;
        for (let flag of game.scenes.active) {
            if (flag.getFlag(`world`, `${scopeFlag}.${flagName}.${tokenName}`)) {
                flag.unsetFlag(`world`, `${scopeFlag}.${flagName}.-=${tokenName}`);
            }
            if (deep !== false) flag.unsetFlag(`world`, `${scopeFlag}.${flagName}`);
        }
    }
}
async function isUrlFound(url) {
    try {
        const response = await fetch(url, {
            method: 'HEAD',
            cache: 'no-cache'
        });

        return response.status === 200;

    } catch (error) {
        // console.log(error);
        return false;
    }
}

async function GetDirFace(token) {
    return token.getFlag('about-face', 'position.facing');
}

async function GetItemIdCompendium(cpack, itemName) {
    const pack = game.packs.get(`${cpack}`);
    await pack.getIndex()
    return await pack.index.find(e => e.name === `${itemName}`);
}
