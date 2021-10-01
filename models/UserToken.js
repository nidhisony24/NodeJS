const { Model } = require("objection");

class UserToken extends Model {
    static get tableName() {
        return 'user_tokens';
    }
}

module.exports = UserToken;