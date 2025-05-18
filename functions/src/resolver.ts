import * as admin from 'firebase-admin';
import { Resolvers, Location, Item, User, ContactMethod} from './generated/graphql';
var serviceAccount = require("./dllm-libray-firebase-adminsdk.json");


const projectId = process.env.GCLOUD_PROJECT || 'dllm-libray';
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
}
);

const db = admin.firestore();

interface Context {
  loginUser: { uid: string; email: string } | null;
}





export const resolvers: Resolvers = {
  Query: {
    me: async (_: any, __: any, { loginUser }: Context): Promise<User | null> => {
      console.log(loginUser);
      if (!loginUser) throw new Error('Not authenticated');
      const userDoc = await db.collection('users').doc(loginUser.uid).get();
      console.log(userDoc.data());
      if (!userDoc.exists) return null;
      const data = userDoc.data() as User;
      console.log(data);
      return { ...data };
    },
    itemsByLocation: async (
      _: any,
      { latitude, longitude, radiusKm, category, status, keyword, limit = 20, offset = 0 }: any
    ): Promise<Item[]> => {
      let query = db.collection('items').orderBy('id');
      if (category) query = query.where('category', 'array-contains-any', category);
      if (status) query = query.where('status', '==', status);
      if (keyword) query = query.where('name', '>=', keyword).where('name', '<=', keyword + '\uf8ff');

      const snapshot = await query.limit(limit).offset(offset).get();
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));

      // Haversine formula for radius filtering (Firestore lacks native geospatial)
      const filteredItems = items.filter(item => {
        if (!item.location) return false;
        const R = 6371; // Earth's radius in km
        const dLat = (item.location.latitude - latitude) * Math.PI / 180;
        const dLon = (item.location.longitude - longitude) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(latitude * Math.PI / 180) * Math.cos(item.location.latitude * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance <= radiusKm;
      });

      return filteredItems;
    },
    itemsByUser: async (
      _: any,
      { userId, category, status, keyword, limit = 20, offset = 0 }: any
    ): Promise<Item[]> => {
      let query = db.collection('items').where('ownerId', '==', userId).orderBy('id');
      if (category) query = query.where('category', 'array-contains-any', category);
      if (status) query = query.where('status', '==', status);
      if (keyword) query = query.where('name', '>=', keyword).where('name', '<=', keyword + '\uf8ff');

      const snapshot = await query.limit(limit).offset(offset).get();
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
      return items;
    },
    user: async (_: any, { id }: any): Promise<User | null> => {
      const userDoc = await db.collection('users').doc(id).get();
      if (!userDoc.exists) return null;
      console.log(userDoc.data());
      const data = userDoc.data() as User;
      console.log(data);
      return { ...data };
    }
  },
  Mutation: {
    createUser: async (_: any, { nickname, address }: any, { loginUser }: Context): Promise<User> => {
      if (!loginUser) throw new Error('Not authenticated');
      let location: Location = {
        latitude: 0,
        longitude: 0,}
      const userData: User = {
        id: loginUser.uid,
        email: loginUser.email,
        nickname: nickname || undefined,
        location: location,  // require to resolve from google map base on address
        address: address || undefined,
        createdAt: new Date().toISOString(),
      };
      await db.collection('users').doc(loginUser.uid).set(userData);
      return userData;
    },
    updateUser: async (_: any, { nickname, contactMethods, address }: any, { loginUser }: Context): Promise<User> => {
      if (!loginUser) throw new Error('Not authenticated');
      const updates: Partial<User> = {
        nickname: nickname || undefined,
        contactMethods: contactMethods || undefined,
        location: undefined,  // require to resolve from google map base on address
        address: address || undefined,
      };
      await db.collection('users').doc(loginUser.uid).update(updates);
      const updatedDoc = await db.collection('users').doc(loginUser.uid).get();
      return { ...(updatedDoc.data() as User) };
    },
    createItem: async (_: any, args: any, { loginUser }: Context): Promise<Item> => {
      if (!loginUser) throw new Error('Not authenticated');
      const itemData: Item = {
        id: '',
        ownerId: loginUser.uid,
        name: args.name,
        description: args.description || undefined,
        condition: args.condition,
        category: args.category,
        status: args.status,
        images: args.images || [],
        publishedYear: args.publishedYear || undefined,
        language: args.language,
        //location: undefined,  // require to get from user service 's location
        createdAt: new Date().toISOString(),
      };
      const docRef = await db.collection('items').add(itemData);
      itemData.id = docRef.id; // Set the ID after adding to Firestore
      return { ...itemData };
    },
  },
};