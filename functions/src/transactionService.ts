import { Timestamp } from "firebase-admin/firestore";
import { db } from "./platform";
import { Transaction, TransactionStatus, User } from "./generated/graphql";
import { ItemService } from "./itemService";
import { UserService } from "./userService";
import { it } from "node:test";

type TransactionModel = Omit<
  Transaction,
  "id" | "requestor" | "item" | "createdAt" | "updatedAt"
> & {
  requestorId: string;
  itemId: string;
  created: Timestamp;
  updated: Timestamp;
};
export class TransactionService {
  // Placeholder for transaction service methods
  // Implement methods like createTransaction, approveTransaction, etc.
  constructor(
    private itemService: ItemService,
    private userService: UserService // geofire.geohashForLocation is a function that takes a location and returns a geohash
  ) {}

  async transactionById(id: string): Promise<Transaction | null> {
    const transactionDoc = await db.collection("transactions").doc(id).get();
    if (!transactionDoc.exists) return null;
    const data = transactionDoc.data() as TransactionModel;
    const item = await this.itemService.itemById(data.itemId);
    if (!item) {
      throw new Error(`Item with id ${data.itemId} not found`);
    }
    const requestor = await this.userService.userById(data.requestorId);
    return {
      id: transactionDoc.id,
      item: item,
      requestor: requestor,
      status: data.status,
      createdAt: data.created.seconds * 1000,
      updatedAt: data.updated.seconds * 1000,
    };
  }

  async transactionsByItemNotStatus(
    itemId: string,
    statuses: TransactionStatus[]
  ): Promise<Transaction[]> {
    const transactionsMap = await this._transactionsByItemNotStatus(
      itemId,
      statuses
    );
    const transactions: Transaction[] = [];
    for (const [id, data] of transactionsMap) {
      const item = await this.itemService.itemById(data.itemId);
      if (!item) {
        throw new Error(`Item with id ${data.itemId} not found`);
      }
      if (!data.requestorId) {
        throw new Error(`Requestor ID not found for transaction ${id}`);
      }
      const requestor = await this.userService.userById(data.requestorId);
      transactions.push({
        id: id,
        item: item,
        requestor: requestor,
        status: data.status,
        createdAt: data.created.seconds * 1000,
        updatedAt: data.updated.seconds * 1000,
      });
    }
    return transactions;
  }

  async _transactionsByItemNotStatus(
    itemId: string,
    statuses: TransactionStatus[]
  ): Promise<Map<string, TransactionModel>> {
    let query = db.collection("transactions").where("itemId", "==", itemId);
    if (statuses.length > 0) {
      query = query.where("status", "not-in", statuses);
    }
    query = query.orderBy("updated", "desc");
    const transactionDocs = await query.get();
    const transactions: Map<string, TransactionModel> = new Map();
    for (const doc of transactionDocs.docs) {
      const data = doc.data() as TransactionModel;
      transactions.set(doc.id, data);
    }
    return transactions;
  }

  async createTransaction(
    requestor: User,
    itemId: string
  ): Promise<Transaction> {
    // Logic to create a transaction
    const item = await this.itemService.itemById(itemId);
    if (!item) {
      throw new Error(`Item with id ${itemId} not found`);
    }
    const userToNotify = item.holderId ? item.holderId : item.ownerId;
    if (!userToNotify) {
      throw new Error(`No user to notify for item with id ${itemId}`);
    }
    const requestorId = requestor.id;
    // check if there is 2 open transactions for the item
    const existingTransactions = await this._transactionsByItemNotStatus(
      itemId,
      [TransactionStatus.Completed, TransactionStatus.Cancelled]
    );
    if (existingTransactions.size >= 2) {
      throw new Error(
        `There are already 2 open transactions for item with id ${itemId}`
      );
    }
    const transactionModel: TransactionModel = {
      requestorId: requestorId,
      itemId: itemId,
      created: Timestamp.now(),
      updated: Timestamp.now(),
      status: TransactionStatus.Pending,
    };
    // Save transaction to the database
    const transactionRef = await db
      .collection("transactions")
      .add(transactionModel);
    if (!transactionRef.id) {
      throw new Error("Failed to create transaction");
    }

    let rv: Transaction = {
      id: transactionRef.id,
      item: item,
      requestor: requestor,
      status: transactionModel.status,
      createdAt: transactionModel.created.seconds * 1000,
      updatedAt: transactionModel.updated.seconds * 1000,
    };
    return rv;
  }

  async approveTransaction(id: string): Promise<Transaction> {
    const item = await this.itemService.itemById("5CBaMhW66yUP9MwqHcub");
    if (!item) {
      throw new Error(`Item with id not found`);
    }

    // Logic to approve a transaction
    return {
      id,
      item: item,
      status: TransactionStatus.Approved,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async transferTransaction(id: string): Promise<Transaction> {
    const item = await this.itemService.itemById("5CBaMhW66yUP9MwqHcub");
    if (!item) {
      throw new Error(`Item with id not found`);
    }
    // Logic to transfer a transaction
    return {
      id,
      item: item,
      status: TransactionStatus.Transfered,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async receiveTransaction(id: string): Promise<Transaction> {
    const item = await this.itemService.itemById("5CBaMhW66yUP9MwqHcub");
    if (!item) {
      throw new Error(`Item with id not found`);
    }

    // Logic to receive a transaction
    return {
      id,
      item: item,
      status: TransactionStatus.Completed,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async cancelTransaction(id: string): Promise<boolean> {
    // Logic to cancel a transaction
    return true;
  }
}
