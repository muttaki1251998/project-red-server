const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../model/User");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3 = new S3Client({ region: process.env.AWS_REGION });

exports.signup = async (req, res) => {
  try {
    const {
      fullname,
      email,
      password,
      phone,
      occupation,
      facebookLink,
      linkedInLink,
      address,
      city,
      country,
      degree,
      university,
    } = req.body;

    // Fetch URLs from S3
    const profilePicture = req.files["profilePicture"]
      ? req.files["profilePicture"][0].location
      : undefined;
    const profileIdPicture = req.files["profileIdPicture"]
      ? req.files["profileIdPicture"][0].location
      : undefined;

    // Check if the required pictures are provided
    if (!profilePicture || !profileIdPicture) {
      return res.status(400).json({
        message: "Both profile picture and profile ID picture are required",
      });
    }

    const newUser = new User({
      fullname,
      email,
      password,
      phone,
      occupation,
      profilePicture,
      profileIdPicture,
      facebookLink,
      linkedInLink,
      address,
      city,
      country,
      degree,
      university,
    });

    await newUser.save();
    const token = jwt.sign({ _id: newUser._id }, "secretKey", {
      expiresIn: "2h",
    });
    res.status(201).send({ newUser, token });
  } catch (error) {
    console.error("Error during signup:", error);
    res
      .status(500)
      .send({ message: "Error occurred during registration", error });
  }
};

exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: "Email not found." });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).send({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ _id: user._id }, "secretKey", { expiresIn: "2h" });
    res.status(200).send({ user, token });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select(
      "-password -profileIdPicture"
    );

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    res.status(200).send(user);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error retrieving user profile." });
  }
};

exports.getUserDetailsForAdmin = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    res.status(200).send(user);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error retrieving user details." });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isVerified: true },
      { new: true } // This option returns the updated document
    );

    if (!updatedUser) {
      return res.status(404).send({ message: "User not found." });
    }

    res
      .status(200)
      .send({ message: "User verified successfully", user: updatedUser });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error verifying user." });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -profileIdPicture"); // Exclude password and profileIdPicture fields

    if (!users || users.length === 0) {
      return res.status(404).send({ message: "No users found." });
    }

    res.status(200).send(users);
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).send({ message: "Error retrieving users.", error });
  }
};
exports.getAllUsersForAdmin = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude password and profileIdPicture fields

    if (!users || users.length === 0) {
      return res.status(404).send({ message: "No users found." });
    }

    res.status(200).send(users);
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).send({ message: "Error retrieving users.", error });
  }
};

exports.getAllAddresses = async (req, res) => {
  try {
    // Find all users and return the address and city fields
    const users = await User.find({}, { address: 1, city: 1, _id: 0 });

    if (!users || users.length === 0) {
      return res.status(404).send({ message: "No addresses found." });
    }

    // Combine address and city for each user
    const addresses = users.map((user) => {
      let fullAddress = user.address;
      if (user.city) {
        fullAddress = `${fullAddress}, ${user.city}`;
      }
      return fullAddress;
    });

    res.status(200).send({ addresses });
  } catch (error) {
    console.error("Error retrieving addresses:", error);
    res.status(500).send({ message: "Error retrieving addresses.", error });
  }
};

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  // Predefined admin credentials
  const adminEmail = "projectred@scholarbangla.com";
  const adminPassword = "abusyed2024";

  try {
    // Check if email and password match
    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).send({ message: "Invalid email or password." });
    }

    // Create a JWT token
    const token = jwt.sign({ role: "admin" }, "adminSecretKey", {
      expiresIn: "1h",
    });

    // Return the token to the client
    res.status(200).send({ message: "Admin login successful", token });
  } catch (error) {
    console.error("Error during admin login:", error);
    res
      .status(500)
      .send({ message: "Error occurred during admin login", error });
  }
};

// Function to delete a file from S3
async function deleteS3Image(imageUrl) {
  try {
    const bucketName = process.env.AWS_S3_BUCKET;
    const key = imageUrl.split(".com/")[1]; // Extract the key from the URL

    if (!key) {
      console.error(`Invalid S3 URL: ${imageUrl}`);
      throw new Error("Invalid S3 URL");
    }

    const deleteParams = {
      Bucket: bucketName,
      Key: key,
    };

    console.log(`Attempting to delete image with key: ${key}`); // Debugging line

    await s3.send(new DeleteObjectCommand(deleteParams));
    console.log(`Deleted old image: ${key}`);
  } catch (error) {
    console.error(`Error deleting old image: ${error.message}`);
  }
}

exports.editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    let updatedData = { ...updates };

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // If a new profile picture is uploaded, delete the old one and update with the new one
    if (req.files && req.files["profilePicture"]) {
      let newProfilePicture = req.files["profilePicture"][0].location;
      // console.log("New image", req.files["profilePicture"][0].location)

      // Delete the old profile picture from S3
      await deleteS3Image(user.profilePicture);

      // Update the new profile picture
      updatedData.profilePicture = newProfilePicture;
    }

    // Update the user in the database
    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).send({ message: "Failed to update user" });
    }

    res.status(200).send({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send({ message: "Error occurred while updating user", error });
  }
};
