import crypto from "crypto";

function createRefreshToken(){
    return crypto.randomBytes(40).toString('hex');
}

export default createRefreshToken;