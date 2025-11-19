import { db, GetPublicUrlForGSFile } from "./platform";
import { CategoryMap, CategoryMapInput } from "./generated/graphql";
import firebase from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

const SYSTEM_DB = db.collection("system");

export class SystemService {
  constructor() {
    // initialization for category maps if needed
    SYSTEM_DB.doc("category")
      .get()
      .then((categoryMapsRef) => {
        if (!categoryMapsRef.exists) {
          categoryMapsRef.ref.set({});
        }
      });
  }
  async upsertCategoryMap(
    en: string,
    categoryMaps: [CategoryMapInput]
  ): Promise<[CategoryMap]> {
    en = en.trim().toLowerCase();
    const categoryMapsRef = await SYSTEM_DB.doc("category")
      .collection("categoryMaps")
      .doc(en)
      .get();

    let categoryMapData: any = {};
    let foundEn = false;
    for (const categoryMap of categoryMaps) {
      if (categoryMap.language === "en") {
        foundEn = true;
        continue; // Skip English as it's already handled
      }
      categoryMapData[categoryMap.language] = categoryMap.value;
    }

    await categoryMapsRef.ref.set(categoryMapData);
    if (!foundEn) {
      categoryMaps.push({ language: "en", value: en });
    }
    return categoryMaps;
  }
  async addCategoryTree(
    parentPath: string | null,
    leafCategory: string
  ): Promise<string> {
    let newCategoryPath = "";
    if (parentPath && parentPath.trim() !== "") {
      newCategoryPath = `${parentPath}/${leafCategory}`;
    } else {
      newCategoryPath = leafCategory;
    }
    newCategoryPath = newCategoryPath.trim().toLowerCase();

    const categoryTreesRef = SYSTEM_DB.doc("category")
      .collection("categoryTrees")
      .doc("default");

    const categoryTreesDoc = await categoryTreesRef.get();
    let categoryTrees: string[] = [];
    if (categoryTreesDoc.exists) {
      const data = categoryTreesDoc.data();
      if (data && data.trees) {
        categoryTrees = data.trees;
      }
    }

    if (!categoryTrees.includes(newCategoryPath)) {
      categoryTrees.push(newCategoryPath);
      await categoryTreesRef.set({ trees: categoryTrees });
    }

    return newCategoryPath;
  }

  async getDefaultCategoryTrees(): Promise<string[]> {
    const categoryTreesRef = SYSTEM_DB.doc("category")
      .collection("categoryTrees")
      .doc("default");

    const categoryTreesDoc = await categoryTreesRef.get();
    let categoryTrees: string[] = [];
    if (categoryTreesDoc.exists) {
      const data = categoryTreesDoc.data();
      if (data && data.trees) {
        categoryTrees = data.trees;
      }
    }
    return categoryTrees;
  }

  async getAllCategoryMaps(): Promise<CategoryMap[][]> {
    const categoryMapsRef =
      SYSTEM_DB.doc("category").collection("categoryMaps");

    const snapshot = await categoryMapsRef.get();
    const categoryMaps: CategoryMap[][] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const categoryMap: [CategoryMap] = [
        {
          language: "en",
          value: doc.id,
        },
      ];
      for (const key in data) {
        categoryMap.push({
          language: key,
          value: data[key],
        });
      }
      categoryMaps.push(categoryMap);
    });
    return categoryMaps;
  }
}
