import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    fullName: { 
      type: String, 
      default: "" 
    },
    profilePic: { 
      type: String, 
      default: "" 
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
      }
    }
  }
);

userSchema.statics.isValidId = function (id) {
  return mongoose.Types.ObjectId.isValid(id);
};

const User = mongoose.model("User", userSchema);
export default User;