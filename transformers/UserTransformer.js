const { AWS_BASE_URL } = require("../utils/WebData");

const transform = (element) => {
    return {
        id: element.id,
        username: element.username,
        name: element.name,
        email: element.email,
        status: (element.status == 1),
        notification: (element.notification == 1),
        role: element.role,
        avatar: element.avatar ? `${AWS_BASE_URL}${element.avatar}` : `${AWS_BASE_URL}default_avatar.png`
    };
};

module.exports = { transform };