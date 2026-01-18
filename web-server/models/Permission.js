import mongoose from 'mongoose';
import { ROLES } from "../enums/Roles.js";

const permissionSchema = new mongoose.Schema({
    resourceId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    role: {
        type: String,
        required: true,
        enum: Object.values(ROLES)
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isSpam: {
        type: Boolean,
        default: false
    },
    isStarred: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
});

permissionSchema.virtual('id').get(function () {
    return this._id.toString();
});

permissionSchema.index({ resourceId: 1, userId: 1 }, { unique: true });

const Permissions = mongoose.model('Permission', permissionSchema);

export default Permissions;