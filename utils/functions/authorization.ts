import { CognitoJwtVerifier } from "aws-jwt-verify";

// Verifier that expects valid access tokens:
    const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.USER_POOL_ID || "",
    tokenUse: "access",
    clientId: process.env.CLIENT_ID || ""
});

export const authorize = async (token: string | undefined) => {
    if (!token) { 
        console.log("No token provided");
        throw new Error("No token provided");
    }           
    try {
        const payload = await verifier.verify(token);
        console.log("Token is valid. Payload:", payload);
        return payload;
    } catch (error) {
        console.log("Token not valid!", error);
        throw new Error("Unauthorized");
    }
}
export default authorize;