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
    }
}, {
    timestamps: true 
});

permissionSchema.index({ resourceId: 1, userId: 1 }, { unique: true });

const PermissionModel = mongoose.model('Permission', permissionSchema);

export default PermissionModel;