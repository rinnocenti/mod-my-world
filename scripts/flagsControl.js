const moduleSocket = "module.mod-my-world";
const scopeFlag = 'worldTrigger';
export class FlagControl {
    constructor(flagScene, type = 'perPlayer') {
        this.flagScene = flagScene;
        this.token = canvas.tokens.controlled[0];
        this.type = type;
        this.user = game.user;
        if (!this.token) return ui.notifications.error("Nenhum token selecionado");
        this.CheckTokenFlag(this.flagScene, this.token.name, this.type);

    };
    async CheckTokenFlag() {
        let invalid = false;
        if (this.flagScene !== undefined && this.flagScene !== '') {
            if (this.type === 'once') {
                ///// Acontece uma vez por jogo e ativa com qualquer jogador.
                //for (let auser of game.users) {
                //    invalid = auser.getFlag(`${scopeFlag}`, `${flagScene}.${tokenName}`) ? auser.getFlag(`world`, `${flagScene}.${tokenName}`) : false;
                //    if (invalid !== false) return invalid;
                //}
            } else if (this.type === 'perPlayer') {
                /// Acontece uma vez por jogo e ativa uma vez para cada personagem.
                invalid = this.token.getFlag(`${scopeFlag}`, `${flagScene}.${tokenName}`) ? this.token.getFlag(`${scopeFlag}`, `${flagScene}.${tokenName}`) : false;
            }
            if (invalid === false) {
                this.token.setFlag(`${scopeFlag}`, `${flagScene}.${tokenName}`, true);
            }
        }
        return invalid;
    }
}