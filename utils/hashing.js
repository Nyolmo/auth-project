const bcrypt = require('bcryptjs');

exports.doHash = async (value, saltValue) =>{
    const result =await  bcrypt.hash(value, saltValue);
    return result;
}