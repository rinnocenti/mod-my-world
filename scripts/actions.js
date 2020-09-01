const scopeFlag = 'worldTrigger'
export class Actions {
    constructor(tokenid, userid, flags) {
        this.controlToken = canvas.tokens.get(tokenid);
        this.controlUser = game.users.get(userid);
        this.scene = game.scenes.active;
        this.flags = (flags != undefined) ? flags.split('.') : null;
    }

    SetFlag(flagName, type = 'token', range = 'perPlayer') {
        let activated = false;
        let single = (type === 'token') ? this.controlToken : this.controlUser;
        let multi = (type === 'token') ? canvas.tokens : game.users;
        if (flagName !== undefined && flagName !== '') {
            if (range === 'once') {
                ///// Acontece uma vez por jogo e ativa com qualquer jogador.
                for (let flag of multi) {
                    activated = flag.getFlag(`world`, `${scopeFlag}.${flagName}`) ? flag.getFlag(`world`, `${scopeFlag}.${flagName}`) : false;
                    if (activated !== false) return activated;
                }
            } else if (range === 'perPlayer') {
                /// Acontece uma vez por jogo e ativa uma vez para cada personagem.
                activated = single.getFlag(`world`, `${scopeFlag}.${flagName}`) ? single.getFlag(`world`, `${scopeFlag}.${flagName}`) : false;
            }
            if (activated === false) {
                ui.notifications.info("Set newScope");
                single.setFlag(`world`, `${scopeFlag}.${flagName}`, true);
            }
        }
        return activated;
    }
    SetSceneFlag(tokenName, flagName) {
        let activated = false;
        if (tokenName !== undefined && tokenName !== '') {
            activated = this.scene.getFlag(`world`, `${scopeFlag}.${flagName}.${tokenName}`) ? this.scene.getFlag(`world`, `${scopeFlag}.${flagName}.${tokenName}`) : false;
        }
        if (activated === false) {
            //ui.notifications.info("Set newScope");
            this.scene.setFlag(`world`, `${scopeFlag}.${flagName}.${tokenName}`, true);
        }
        return activated;
    }
    UnSetSceneFlag(tokenName, flagName, deep = false) {
        for (let flag of this.scene) {
            if (flag.getFlag(`world`, `${scopeFlag}.${flagName}.${tokenName}`)) {
                flag.unsetFlag(`world`, `${scopeFlag}.${flagName}.-=${tokenName}`);
            }
            if (deep !== false) flag.unsetFlag(`world`, `${scopeFlag}.${flagName}`);
        }
    }

    UnSetFlag(flagName, type = 'token', deep = false) {
        let multi = (type === 'user') ? game.users : canvas.tokens;
        for (let flag of multi) {
            if (flag.getFlag(`world`, `${scopeFlag}.${flagName}`)) {
                flag.unsetFlag(`world`, `${scopeFlag}.-=${flagName}`);
            }
            if (deep !== false) flag.unsetFlag(`world`, `${scopeFlag}`);
        }
    }

    GetPoolScene(flagName) {
        return this.scene.getFlag(`world`, `${scopeFlag}.${flagName}`);
    }
}