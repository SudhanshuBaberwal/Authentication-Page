import nodemailer from "nodemailer"

const tranporter = nodemailer.createTransport({
    service : "gmail",
    secure : true,
    host : "smtp-relay.brevo.com",
    port : 465,
    auth : {
        user : "24bcs147@iiitdwd.ac.in",
        pass : "kqknmgxbnlaxirmq"
        // user : process.env.SMTP_EMAIL,
        // pass : process.env.SMTP_PASS
    }
});

export default tranporter;