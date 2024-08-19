const express = require("express");
const path = require("path");
const connectdb = require("./db");

const databaseSwitcher = async (req, res, next) => {

  const frontendId = req.headers["x-frontend-id"];
  if (frontendId != 'project-red') {
    return res.status(400).send("Frontend identifier is wrong or not present");
  }

  try {
    await connectdb(frontendId);
    next();
  } catch (error) {
    res.status(500).send("Database connection error");
  }
};

module.exports = {
  databaseSwitcher,
};
