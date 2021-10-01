const { v4: uuidv4 } = require("uuid");


exports.sleep = function(ms){
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

exports.removeMask = function(str){
    return str.replace(/[^a-zA-Z0-9]/g, "");
};

exports.uuid = () => {
    return uuidv4();
};

