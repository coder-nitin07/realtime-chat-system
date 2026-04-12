import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    type: {
        type: String,
        enum: [ 'private', 'group' ],
        default: 'private'
    },
    groupName: {
        type: String,
        default: null
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }
},{ timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;