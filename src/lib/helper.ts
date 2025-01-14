import { userSocketIDs } from "../app.js";

interface Member {
    id: string;
}

export const getOtherMember = (members: Member[], userId: string): Member | undefined =>
    members.find((member) => member.id.toString() !== userId.toString());

export const getSockets = (users: string[] = []) => {
  const sockets = users.map((user) => {
    const socketId = userSocketIDs.get(user.toString());
    if (!socketId) {
      console.warn(`No socket ID found for user: ${user}`);
      return null; // or handle the case appropriately
    }
    return socketId;
  }).filter((socket) => socket !== null);

  return sockets;
};


interface File {
    mimetype: string;
    buffer: Buffer;
}

export const getBase64 = (file: File): string =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
