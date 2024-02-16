export type User = {
    userId?: number
    username? : string
    password? : string
    profilePicture? : string
    description? : string
    status? : string
    strikes : number
}

export type MessageType = {
    text: string
    image: string
    senderId: number
    messageId: number
    roomId: number
    prevMessage: MessageType
    nextMessage: MessageType
    date: Date
    isDeleted: boolean
    seenBy: number[]
    username: string
    userProfilePicture: string
    parentId: number
    parentText: string
    parentImage: string
    parentUsername: string
};

export type RoomInfo = {
    userId: number
    roomId: number
    username: string
    userProfilePicture: string
    userStatus: string
    roomType: string
    groupName: string
    groupProfilePicture: string
}