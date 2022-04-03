const router = require("express").Router();
const User = require("../model/User");
const bcryptjs = require("bcryptjs");
import jsonwebtoken, { JwtPayload } from "jsonwebtoken";

const Joi = require("@hapi/joi");

require("dotenv").config();
const tokenSecret = process.env.TOKEN_SECRET as string;

/**
 * Schema der Nutzer in der MongoDB
 */
const schema = Joi.object({
  name: Joi.string().min(6).required(),
  password: Joi.string().min(6).required(),
  league: Joi.string().min(3).required(),
});

/**
 * Registrierungsschnittstelle.
 *
 */
router.post("/register", async (req: any, res: any) => {
  try {
    let token = jsonwebtoken.verify(req.body.token, tokenSecret) as JwtPayload;
    let currentUser = await User.findOne({ _id: token._id });

    if (!currentUser.admin) return res.status(403).send();
  } catch (e) {
    return res.status(403).send();
  }

  const { error } = schema.validate(req.body.user);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  try {
    const emailExist = await User.findOne({ name: req.body.user.name });

    if (emailExist) {
      return res.status(400).send("Name already in use");
    }

    const cryptedPW = await bcryptjs.hash(req.body.user.password, 10);
    const user = new User({
      name: req.body.user.name,
      password: cryptedPW,
      league: req.body.user.league,
      admin: req.body.user.admin,
    });

    const savedUser = await user.save();
    res.status(201);
    res.send({ user: user._id });
  } catch (err) {
    res.status(400).send(err);
  }
});

/**
 * Loginschnittstelle.
 * Gibt einen JWT zurück
 */
router.post("/login", async (req: any, res: any) => {
  const user = await User.findOne({ name: req.body.name });
  if (!user) {
    return res.status(400).send("name not found");
  }

  const vailidPass = await bcryptjs.compare(req.body.password, user.password);
  if (!vailidPass) {
    return res.status(400).send("Invalid Password");
  }
  if (user.league !== req.body.league || user.disabled)
    return res.status(403).send("Forbidden");

  const token = jsonwebtoken.sign(
    { _id: user._id, _league: user.league },
    tokenSecret
  );
  res.status(200);
  res.header("auth-token", token).send(token);
});

/**
 * Schnittstelle  zur Prüfung des JWT auf Gültigkeit.
 */
router.post("/validate", async (req: any, res: any) => {
  try {
    let token = jsonwebtoken.verify(req.body.token, tokenSecret) as JwtPayload;
    let user = await User.findOne({ _id: token._id });
    console.log("user:", user);

    if ((user.league !== req.body.league || user.disabled) && !user.admin)
      return res.status(403).send();

    res.status(200).send();
  } catch (e) {
    console.log(e);

    return res.status(500).send();
  }
});

/**
 *  Checks if user is Admin
 *
 * @param req Request welcher auf Adminuser geprüft werden soll
 * @returns User
 */
async function isAdmin(req: any): Promise<boolean> {
  try {
    let token = jsonwebtoken.verify(req.body.token, tokenSecret) as JwtPayload;
    let user = await User.findOne({ _id: token._id });

    return user.admin;
  } catch (e) {
    console.log(e);
  }
  return false;
}

/**
 * Gibt alle Nutzer in der Datenbank zurück.
 */
router.post("/config", async (req: any, res: any) => {
  if (!(await isAdmin(req))) return res.status(403).send();

  let result = await User.find();
  result = result.map(
    (element: any) =>
      (element = {
        _id: element._id,
        name: element.name,
        league: element.league,
        disabled: element.disabled,
      })
  );

  return res.status(200).send(result);
});

/**
 * Ersetzt setzt disabled für Nutzer[] neu
 */
router.post("/config/save", async (req: any, res: any) => {
  if (!(await isAdmin(req))) return res.status(403).send();

  try {
    let users: [] = req.body.users;

    users.forEach(async (element: any) => {
      let currentUser = await User.findOne({ name: element.name });
      currentUser.disabled = element.disabled;
      currentUser.save();
    });
    res.status(200).send();
  } catch (e) {
    console.log(e);

    return res.status(500).send();
  }
});

/**
 * Löscht einen Nutzer aus der Datenbank
 */
router.post("/config/delete", async (req: any, res: any) => {
  if (!(await isAdmin(req))) return res.status(403).send();

  try {
    let users: [] = req.body.users;

    users.forEach(async (element: any) => {
      let currentUser = await User.deleteOne({ name: element.name });
    });
    return res.status(200).send();
  } catch (e) {
    console.log(e);

    return res.status(500).send();
  }
});

/**
 * Schnittstelle um auf Admin zu Prüfen.
 */
router.post("/isAdmin", async (req: any, res: any) => {
  if (!(await isAdmin(req))) return res.status(403).send();
  if (await isAdmin(req)) return res.status(200).send();
});

module.exports = router;
