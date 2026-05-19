import QRCode from "qrcode";

const otpAuthUrl = process.argv[2];

if(!otpAuthUrl) throw new Error("Pass otpAuthUrl as argument");

const main = async() => {
    await QRCode.toFile('totp.png', otpAuthUrl);
    console.log(`Saved QR code`);
};

main().catch(error => {
    console.log(error);
    process.exit(1);
})