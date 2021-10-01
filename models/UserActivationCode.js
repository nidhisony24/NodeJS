const { Model } = require("objection");

class UserActivationCode extends Model {
    static get tableName() {
        return 'user_activation_codes';
    }
}

module.exports = UserActivationCode;