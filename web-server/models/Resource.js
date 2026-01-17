import mongoose from "mongoose";
import { RESOURCE_TYPE } from "../enums/ResourceType.js";

const resourceSchema = new mongoose.Schema(
  {
    ownerId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: Object.values(RESOURCE_TYPE),
      required: true
    },
    parentId: {
      type: String,
      default: null
    },
    path: {
      type: String,
      required: true
    },
    isDeleted: { type: Boolean, default: false },
    isSpam: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      }
    },
    toObject: {
        virtuals: true,
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
  }
);

resourceSchema.virtual('id').get(function () {
    return this._id.toString();
});

resourceSchema.index({ ownerId: 1 });
resourceSchema.index({ parentId: 1 });
resourceSchema.index({ path: 1 });

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource;