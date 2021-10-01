const { Model } = require("objection");

class UserOtp extends Model {
    static get tableName() {
        return 'user_otps';
    }
}

module.exports = UserOtp;