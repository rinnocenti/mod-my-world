import { Actions } from './actions.js';
export class SingleActions extends Actions {
    constructor(tokenid, userid, action, actionParm, actionTokenName, flags) {
        super(tokenid, userid, flags);
        this.SetActionToken(actionTokenName);
        let param = (actionParm !== undefined) ? actionParm.split('.') : false;
        console.log(this);
        if (flags !== undefined && flags !== '') {
            if (this.SetFlag(...flags.split('.')) !== false) return;
        }
        this.ExecuteAction(action, param);
    }

    ExecuteAction(actions, param) {
        console.log(actions, param);
        let multparam = (param.length < this.actionTokenName.length) ? Array(this.actionTokenName.length).fill(param[0]) : param;
        switch (actions) {
            case 'PauseGame':
                //no param
                this.PauseGame();
                break;
            case 'Permission':
                //owner/observer/limited/none
                this.Permission(multparam);
                break;
            case 'Hidden':
                //false
                this.Hidden(multparam);
                break;
            case 'Talk':
                //`Mensagem[,draconic,false]`
                this.Talk(multparam);
                break;
            case 'PlaySound':
                //soundname.100[.ogg,playlist-import/AmbientTracks.5]
                this.PlaySound(...param);
                break;
            case 'MoveToken':
                //`2,2.3,2`
                this.MoveToken(multparam);
                break;
            case 'SetDoor':
                //`open/close/show/toggle`
                this.SetDoor(multparam);
                break;
            case 'HitTarget':
                //`WeaponTrapName`
                this.HitTarget(multparam);
                break;
            case 'UnSetFlag':
                //FlagName[.user.true]
                this.UnSetFlag(...param);
                break;
            case 'UnSetSceneFlag':
                //FlagName[.true]
                UnSetSceneFlag(this.controlToken.name, flagName, deep = false)
                break;
            default:

        }
    }
    async Hidden(hidden) {
        if (this.actionTokenName === undefined) return ui.notifications.error("Não há um alvo valido");
        for (let i = 0; i < this.actionTokenName.length; i++) {
            let hhidden = (hidden[i] === false || hidden[i] === 'false') ? false : true;
            try {
                this.actionToken[i].update({ "hidden": hhidden });
            } catch (error) { }
            try {
                canvas.drawings.get(this.actionTokenName[i]).update({ "hidden": hhidden });
            } catch (error) { }
            try {
                canvas.tiles.get(this.actionTokenName[i]).update({ "hidden": hhidden });
            } catch (error) { }
        }
    }
    async HitTarget(itemTrapName) {
        if (this.actionTokenName === undefined) return ui.notifications.error("Não há um alvo valido");
        let targets = [this.controlToken];
        for (let i = 0; i < this.actionTokenName.length; i++) {
            let tokenTrap = (this.actionToken[i] !== undefined) ? this.actionToken[i]: this.controlToken;
            let actorTrap = this.actionActor[i];
            if (!actorTrap) return console.log(`DoTrap: Actor ${actorTrap} not found`);
            let item = actorTrap.items.find(t => t.name === itemTrapName[i]);
            if (!item) return console.log(`DoTrap: Item ${itemTrapName[i]} not found`);
            new MidiQOL.TrapWorkflow(actorTrap, item, targets, tokenTrap.center);
        }
    }
    async MoveToken(sqmove) {
        if (this.actionTokenName === undefined) return ui.notifications.error("Não há um alvo valido");
        let newX = 0;
        let newY = 0;
        let g = canvas.scene.data.grid;
        for (let i = 0; i < this.actionTokenName.length; i++) {
            CanvasAnimation.terminateAnimation(`Token.${this.actionToken[i].id}.animateMovement`);
            let squeres = sqmove[i].split(',');
            newX = (this.actionToken[i].data.x + (g * parseInt(squeres[0])));
            newY = (this.actionToken[i].data.y + (g * parseInt(squeres[1])));
            await this.actionToken[i].update({ x: newX, y: newY });
        }
        await canvas.pan(newX, newY);
    }
    async PauseGame() {
        if (game.paused === false)
            game.togglePause(true, true);
    }
    async Permission(nivel) {
        if (this.actionTokenName === undefined) return ui.notifications.error("Não há um alvo valido");
        for (let i = 0; i < this.actionTokenName.length; i++) {
            let permission = (nivel[i] === 'owner') ? 3 : (nivel[i] === 'observer') ? 2 : (nivel[i] === 'limited') ? 1 : 0;
            let actor = game.actors.entities.find(a => a.name === this.actionToken[i].actor.name);
            if (!actor) return `/Whisper GM "Permission: Actor ${this.actionTokenName[i]} not found"`;
            let newpermissions = duplicate(actor.data.permission);
            newpermissions[`${this.controlUser.id}`] = permission;
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
    async SetDoor(actions) {
        if (this.actionTokenName === undefined) return ui.notifications.error("Não há um alvo valido");
        for (let i = 0; i < this.actionTokenName.length; i++) {
            if (actions[i] === 'open') canvas.walls.get(this.actionTokenName[i]).update({ ds: 1 });
            if (actions[i] === 'close') canvas.walls.get(this.actionTokenName[i]).update({ ds: 0 });
            if (actions[i] === 'show') canvas.walls.get(this.actionTokenName[i]).update({ ds: 0, door: 1 });
            if (actions[i] === 'toggle') {
                let stat = (canvas.walls.get(this.actionTokenName[i]).ds === 0) ? 1 : 0;
                canvas.walls.get(this.actionTokenName[i]).update({ ds: stat });
            }
        }
    }
    async Talk(param) {
        if (this.actionTokenName === undefined) return ui.notifications.error("Não há um alvo valido");
        let oldLang = $(`#polyglot select`).val();
        for (let i = 0; i < this.actionTokenName.length; i++) {
            canvas.tokens.selectObjects({});
            let actions = param[i].split(',');
            let message = actions[0];
            let language = (actions[1] !== undefined && actions[1] !== '' && actions[1] !== 'custom') ? actions[1] : 'common';
            let bubble = (actions[2] !== 'false') ? true : false;
            $(`#polyglot select`).val(`${language}`);
            ChatMessage.create({
                speaker: { token: this.actionToken[i], actor: this.actionToken[i].actor, scene: canvas.scene },
                content: `${message}`,
                type: CONST.CHAT_MESSAGE_TYPES.IC,
                blind: false
            }, { chatBubble: bubble });
        }
        setTimeout(function () {
            $(`#polyglot select`).val(`${oldLang}`);
        }, 500);
    }

    async SetActionToken(actionTokenName) {
        this.actionTokenName = [];
        this.actionToken = [];
        this.actionActor = [];
        if (actionTokenName !== undefined && actionTokenName !== '') {
            let actionsTokens = actionTokenName.split('.');
            console.log(actionsTokens);
            for (let i = 0; i < actionsTokens.length; i++) {
                if (actionsTokens[i].toLowerCase() === 'self' || actionsTokens[i].toLowerCase() === 'player') {
                    this.actionTokenName[i] = this.controlToken.name;
                    this.actionToken[i] = this.controlToken;
                    this.actionActor[i] = game.actors.entities.find(a => a.name === this.actionToken[i].actor.name);
                } else {
                    this.actionTokenName[i] = actionsTokens[i];
                    this.actionToken[i] = (canvas.tokens.placeables.find(t => t.name === actionsTokens[i])) ? canvas.tokens.placeables.find(t => t.name === actionsTokens[i]) : canvas.tokens.placeables.find(t => t.id === actionsTokens[i]);
                    try {
                        this.actionActor[i] = game.actors.entities.find(t => t.name === actionsTokens[i]);
                    } catch (error) { }
                    //if (this.actionActor[i] === undefined) {
                    //    try {
                    //        this.actionActor[i] = game.actors.entities.find(t => t.name === this.actionToken[i].actor.name);
                    //    } catch (error) { }
                    //}
                }
            }
        }
    }
}