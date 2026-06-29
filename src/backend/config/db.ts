import crypto from "crypto";
import { initializeApp, getApps, deleteApp, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";

// In-Memory Database Map for Mock mode
const inMemoryDb: { [collection: string]: Map<string, any> } = {};

let db: Firestore | null = null;
let isInMemory = true;

// Registry of all mongoose models
const modelsRegistry: { [key: string]: any } = {};

// Helper to generate a 24-character hex ID (matching MongoDB ObjectId format)
export function generateId(): string {
  return crypto.randomBytes(12).toString("hex");
}

// Helper to get collection name from model name
function getCollectionName(modelName: string): string {
  return modelName.toLowerCase() + "s";
}

// Convert Firestore Timestamps recursively back to JS Date objects
function convertTimestampsToDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj.toDate === "function") {
    return obj.toDate();
  }
  if (obj instanceof Array) {
    return obj.map(convertTimestampsToDates);
  }
  if (typeof obj === "object") {
    // If it's a Firestore Timestamp representation serialized in a weird way
    if (obj._seconds !== undefined && obj._nanoseconds !== undefined) {
      return new Date(obj._seconds * 1000 + obj._nanoseconds / 1000000);
    }
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      newObj[key] = convertTimestampsToDates(obj[key]);
    }
    return newObj;
  }
  return obj;
}

// Serialize data for Firestore (remove undefined, convert custom objects to plain objects)
function serializeDataForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (obj instanceof Date) return obj;
  if (obj instanceof Array) {
    return obj.map(serializeDataForFirestore);
  }
  if (typeof obj === "object") {
    if (typeof obj.toObject === "function") {
      obj = obj.toObject();
    }
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined && typeof val !== "function") {
        newObj[key] = serializeDataForFirestore(val);
      }
    }
    return newObj;
  }
  return obj;
}

// Deep clone helper
function deepClone(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(deepClone);
  if (typeof obj === "object") {
    const clone: any = {};
    for (const key of Object.keys(obj)) {
      clone[key] = deepClone(obj[key]);
    }
    return clone;
  }
  return obj;
}

// Auto-seed in-memory database on startup if it's empty
async function autoSeedInMemory() {
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("Pass@123", salt);
  const defaultPasswordHash = await bcrypt.hash("Password123!", salt);

  // Initialize collections
  inMemoryDb["users"] = new Map();
  inMemoryDb["doctorprofiles"] = new Map();
  inMemoryDb["patientprofiles"] = new Map();
  inMemoryDb["appointments"] = new Map();
  inMemoryDb["payments"] = new Map();
  inMemoryDb["activitylogs"] = new Map();

  // Admin User
  const adminId = "admin_user_id_1234567890";
  inMemoryDb["users"].set(adminId, {
    _id: adminId,
    id: adminId,
    name: "ADMIN",
    email: "admin01@gmail.com",
    password: adminPasswordHash,
    role: "admin",
    emailVerified: true,
    failedLoginAttempts: 0,
    passwordHistory: [adminPasswordHash],
    passwordChangedAt: new Date(),
    refreshTokens: [],
    createdAt: new Date()
  });

  // Super Admin
  const superadminId = "superadmin_user_id_12345";
  inMemoryDb["users"].set(superadminId, {
    _id: superadminId,
    id: superadminId,
    name: "MediCare Lead Architect",
    email: "superadmin@medicare.com",
    password: defaultPasswordHash,
    role: "superadmin",
    emailVerified: true,
    failedLoginAttempts: 0,
    passwordHistory: [defaultPasswordHash],
    passwordChangedAt: new Date(),
    refreshTokens: [],
    createdAt: new Date()
  });

  // Doctor 1 (Sarah Chen)
  const doc1Id = "doctor_sarah_chen_12345";
  inMemoryDb["users"].set(doc1Id, {
    _id: doc1Id,
    id: doc1Id,
    name: "Dr. Sarah Chen",
    email: "sarah.chen@medicare.com",
    password: defaultPasswordHash,
    role: "doctor",
    emailVerified: true,
    failedLoginAttempts: 0,
    passwordHistory: [defaultPasswordHash],
    passwordChangedAt: new Date(),
    refreshTokens: [],
    createdAt: new Date()
  });

  inMemoryDb["doctorprofiles"].set(doc1Id, {
    _id: "doc1_profile_id",
    id: "doc1_profile_id",
    userId: doc1Id,
    qualification: "M.D. Cardiology, Harvard Medical",
    experience: 12,
    medicalRegistrationNumber: "MC-CARD-12345",
    department: "Cardiology",
    languagesSpoken: ["English", "Mandarin"],
    consultationFee: 150,
    availabilityCalendar: [
      { dayOfWeek: "Monday", startTime: "09:00", endTime: "13:00" },
      { dayOfWeek: "Wednesday", startTime: "14:00", endTime: "18:00" }
    ]
  });

  // Patient 1 (James Wilson)
  const pat1Id = "patient_james_wilson_1234";
  inMemoryDb["users"].set(pat1Id, {
    _id: pat1Id,
    id: pat1Id,
    name: "James Wilson",
    email: "james.wilson@gmail.com",
    password: defaultPasswordHash,
    role: "patient",
    emailVerified: true,
    failedLoginAttempts: 0,
    passwordHistory: [defaultPasswordHash],
    passwordChangedAt: new Date(),
    refreshTokens: [],
    createdAt: new Date()
  });

  inMemoryDb["patientprofiles"].set(pat1Id, {
    _id: "pat1_profile_id",
    id: "pat1_profile_id",
    userId: pat1Id,
    allergies: ["Penicillin"],
    bloodGroup: "O+",
    chronicDiseases: ["Hypertension"],
    currentMedications: ["Lisinopril 10mg"],
    height: 180,
    weight: 75,
    emergencyContact: {
      name: "Sarah Wilson",
      phone: "+15550199",
      relationship: "Spouse"
    },
    insuranceDetails: {
      provider: "Blue Cross Blue Shield",
      policyNumber: "POL-BCBS-98765",
      policyHolder: "James Wilson"
    }
  });

  console.log("⚡ Auto-seeded in-memory database with default accounts.");
}

// Connect to Database (real Firestore or In-Memory)
export const connectDB = async () => {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  try {
    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount)
      });
      db = getFirestore();
      isInMemory = false;
      console.log("✅ Firebase Connected: Firestore initialized from service account JSON");
    } else if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        })
      });
      db = getFirestore();
      isInMemory = false;
      console.log("✅ Firebase Connected: Firestore initialized from credentials env");
    } else {
      console.warn("⚠️ MONGODB_URI is not defined and FIREBASE credentials not provided.");
      console.warn("⚠️ Starting in-memory Database fallback for local development...");
      isInMemory = true;
      await autoSeedInMemory();
    }
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", error);
    console.warn("⚠️ Falling back to in-memory Database...");
    isInMemory = true;
    await autoSeedInMemory();
  }
};

// Disconnect Database
export const disconnectDB = async () => {
  const activeApps = getApps();
  if (!isInMemory && activeApps.length > 0) {
    await deleteApp(activeApps[0]);
    db = null;
    isInMemory = true;
    console.log("Disconnected from Firebase.");
  } else {
    // Clear in-memory db
    for (const key of Object.keys(inMemoryDb)) {
      inMemoryDb[key].clear();
    }
    console.log("Cleared in-memory Database.");
  }
};

// Raw database operations
async function rawFindAll(modelName: string): Promise<any[]> {
  const collName = getCollectionName(modelName);
  if (isInMemory) {
    const coll = inMemoryDb[collName];
    return coll ? Array.from(coll.values()).map(deepClone) : [];
  } else {
    if (!db) throw new Error("Firestore not initialized");
    const snapshot = await db.collection(collName).get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      data._id = doc.id;
      data.id = doc.id;
      return convertTimestampsToDates(data);
    });
  }
}

async function rawSave(modelName: string, id: string, data: any): Promise<void> {
  const collName = getCollectionName(modelName);
  if (isInMemory) {
    if (!inMemoryDb[collName]) {
      inMemoryDb[collName] = new Map();
    }
    inMemoryDb[collName].set(id, deepClone({ ...data, _id: id, id }));
  } else {
    if (!db) throw new Error("Firestore not initialized");
    const { _id, id: _, ...firestoreData } = data;
    await db.collection(collName).doc(id).set(serializeDataForFirestore(firestoreData));
  }
}

async function rawDelete(modelName: string, id: string): Promise<void> {
  const collName = getCollectionName(modelName);
  if (isInMemory) {
    inMemoryDb[collName]?.delete(id);
  } else {
    if (!db) throw new Error("Firestore not initialized");
    await db.collection(collName).doc(id).delete();
  }
}

// Schema and defaults helper
function applyDefaults(doc: any, schema: any) {
  if (!schema || !schema.definition) return;

  const traverse = (target: any, def: any) => {
    for (const key of Object.keys(def)) {
      const field = def[key];
      if (target[key] === undefined) {
        if (field && typeof field === "object") {
          if ("default" in field) {
            const defVal = field.default;
            target[key] = typeof defVal === "function" ? defVal() : defVal;
          } else if (field.type instanceof Array || field instanceof Array) {
            target[key] = [];
          } else if (typeof field.type === "object") {
            target[key] = {};
            traverse(target[key], field.type);
          }
        }
      }
    }
  };

  traverse(doc, schema.definition);
}

// Nested field value helper
function getFieldValue(doc: any, path: string): any {
  if (!doc) return undefined;
  if (!path.includes(".")) {
    return doc[path];
  }
  const parts = path.split(".");
  let curr = doc;
  for (const part of parts) {
    if (curr === null || curr === undefined) return undefined;
    curr = curr[part];
  }
  return curr;
}

// Evaluates whether a document matches a MongoDB-style query filter
function matchQuery(doc: any, query: any): boolean {
  if (!query || Object.keys(query).length === 0) return true;

  for (const key of Object.keys(query)) {
    const val = query[key];

    if (key === "$or") {
      if (!(val instanceof Array)) return false;
      let matched = false;
      for (const subQuery of val) {
        if (matchQuery(doc, subQuery)) {
          matched = true;
          break;
        }
      }
      if (!matched) return false;
      continue;
    }

    if (key === "$and") {
      if (!(val instanceof Array)) return false;
      for (const subQuery of val) {
        if (!matchQuery(doc, subQuery)) return false;
      }
      continue;
    }

    const docVal = getFieldValue(doc, key);

    if (val instanceof RegExp) {
      if (typeof docVal !== "string") return false;
      if (!val.test(docVal)) return false;
    } else if (val && typeof val === "object" && !(val instanceof Date) && !(val instanceof Array)) {
      // Operator object e.g. { $nin: ... }
      for (const op of Object.keys(val)) {
        const opVal = val[op];
        if (op === "$nin") {
          if (opVal.includes(docVal)) return false;
        } else if (op === "$in") {
          const docValStr = docVal ? docVal.toString() : "";
          const opValStrings = opVal.map((v: any) => v ? v.toString() : "");
          if (!opValStrings.includes(docValStr)) return false;
        } else if (op === "$gte") {
          if (!(docVal >= opVal)) return false;
        } else if (op === "$gt") {
          if (!(docVal > opVal)) return false;
        } else if (op === "$lte") {
          if (!(docVal <= opVal)) return false;
        } else if (op === "$lt") {
          if (!(docVal < opVal)) return false;
        } else if (op === "$ne") {
          const docStr = docVal ? docVal.toString() : null;
          const opStr = opVal ? opVal.toString() : null;
          if (docStr === opStr) return false;
        } else {
          if (JSON.stringify(docVal) !== JSON.stringify(opVal)) return false;
        }
      }
    } else {
      const docStr = docVal ? docVal.toString() : null;
      const valStr = val ? val.toString() : null;
      if (docStr !== valStr) return false;
    }
  }

  return true;
}

// Apply Mongoose-style projection
function applySelect(inst: any, selectFields: string[]) {
  if (selectFields.length === 0) return;
  const isExclusive = selectFields[0].startsWith("-");
  const cleaned = selectFields.map(f => f.startsWith("-") ? f.substring(1) : f);

  if (isExclusive) {
    for (const key of cleaned) {
      delete inst[key];
    }
  } else {
    const keysToKeep = new Set([...cleaned, "_id", "id"]);
    for (const key of Object.keys(inst)) {
      if (!keysToKeep.has(key)) {
        delete inst[key];
      }
    }
  }
}

function applySelectToObj(obj: any, selectStr: string) {
  const fields = selectStr.split(" ").map(s => s.trim()).filter(Boolean);
  if (fields.length === 0) return obj;

  const isExclusive = fields[0].startsWith("-");
  const cleanedFields = fields.map(f => f.startsWith("-") ? f.substring(1) : f);

  const newObj: any = {};
  if (isExclusive) {
    for (const key of Object.keys(obj)) {
      if (!cleanedFields.includes(key)) {
        newObj[key] = obj[key];
      }
    }
    newObj._id = obj._id;
    newObj.id = obj.id;
  } else {
    newObj._id = obj._id;
    newObj.id = obj.id;
    for (const key of cleanedFields) {
      if (key in obj) {
        newObj[key] = obj[key];
      }
    }
  }
  return newObj;
}

// Populate reference documents
async function populateInstances(instances: any[], pop: any) {
  let path = "";
  let select = "";
  let subPopulate: any = null;

  if (typeof pop === "string") {
    path = pop;
  } else if (typeof pop === "object" && pop !== null) {
    path = pop.path;
    select = pop.select || "";
    subPopulate = pop.populate;
  }

  if (!path) return instances;

  const firstInstance = instances[0];
  if (!firstInstance) return instances;
  const modelSchema = firstInstance.constructor.schema;
  const fieldConfig = modelSchema?.paths?.[path] || modelSchema?.tree?.[path];

  let refModelName = "";
  if (fieldConfig) {
    if (typeof fieldConfig === "object") {
      refModelName = fieldConfig.ref;
      if (!refModelName && fieldConfig.type && typeof fieldConfig.type === "object") {
        refModelName = fieldConfig.type.ref;
      }
    }
  }

  if (!refModelName) {
    if (path === "userId" || path === "patientId" || path === "doctorId" || path === "changedBy") {
      refModelName = "User";
    } else if (path === "paymentId") {
      refModelName = "Payment";
    } else if (path === "appointmentId") {
      refModelName = "Appointment";
    }
  }

  if (!refModelName) {
    return instances;
  }

  const refModel = modelsRegistry[refModelName];
  if (!refModel) {
    return instances;
  }

  const idsToFetch = new Set<string>();
  for (const inst of instances) {
    const val = inst[path];
    if (val) {
      if (typeof val === "string") {
        idsToFetch.add(val);
      } else if (typeof val === "object" && val._id) {
        idsToFetch.add(val._id.toString());
      } else if (typeof val === "object" && val.id) {
        idsToFetch.add(val.id.toString());
      }
    }
  }

  if (idsToFetch.size === 0) return instances;

  const refDocs = await refModel.find({ _id: { $in: Array.from(idsToFetch) } });

  if (subPopulate) {
    await populateInstances(refDocs, subPopulate);
  }

  const refMap = new Map<string, any>();
  for (const refDoc of refDocs) {
    refMap.set(refDoc._id.toString(), refDoc);
  }

  for (const inst of instances) {
    const val = inst[path];
    if (val) {
      const idStr = (typeof val === "string") ? val : (val._id ? val._id.toString() : val.toString());
      const populated = refMap.get(idStr);
      if (populated) {
        let populatedObj = populated;
        if (select) {
          populatedObj = applySelectToObj(populated.toObject(), select);
        }
        inst[path] = populatedObj;
      }
    }
  }

  return instances;
}

// Mongoose style query applicator
class Query {
  protected model: any;
  protected filter: any;
  protected populateList: any[] = [];
  protected sortObj: any = null;
  protected limitVal: number | null = null;
  protected skipVal: number | null = null;
  protected selectFields: string[] = [];

  constructor(model: any, filter: any) {
    this.model = model;
    this.filter = filter;
  }

  populate(path: any, select?: string) {
    this.populateList.push({ path, select });
    return this;
  }

  sort(sortObj: any) {
    this.sortObj = sortObj;
    return this;
  }

  limit(limitVal: number) {
    this.limitVal = limitVal;
    return this;
  }

  skip(skipVal: number) {
    this.skipVal = skipVal;
    return this;
  }

  select(selectFields: string) {
    this.selectFields = selectFields.split(" ").map(s => s.trim()).filter(Boolean);
    return this;
  }

  async exec() {
    let docs = await this.model.rawFindAll();

    docs = docs.filter((doc: any) => matchQuery(doc, this.filter));

    if (this.sortObj) {
      docs.sort((a: any, b: any) => {
        for (const key of Object.keys(this.sortObj)) {
          const dir = this.sortObj[key];
          const valA = a[key];
          const valB = b[key];
          if (valA < valB) return dir === -1 ? 1 : -1;
          if (valA > valB) return dir === -1 ? -1 : 1;
        }
        return 0;
      });
    }

    if (this.skipVal !== null) {
      docs = docs.slice(this.skipVal);
    }
    if (this.limitVal !== null) {
      docs = docs.slice(0, this.limitVal);
    }

    let instances = docs.map((doc: any) => new this.model(doc, false));

    for (const pop of this.populateList) {
      instances = await populateInstances(instances, pop);
    }

    if (this.selectFields.length > 0) {
      for (const inst of instances) {
        applySelect(inst, this.selectFields);
      }
    }

    return instances;
  }

  then(onfulfilled?: any, onrejected?: any) {
    return this.exec().then(onfulfilled, onrejected);
  }
}

class FindOneQuery extends Query {
  async exec() {
    const results = await super.exec();
    return results[0] || null;
  }
}

class FindByIdQuery {
  private query: FindOneQuery;
  constructor(model: any, id: string) {
    this.query = new FindOneQuery(model, { _id: id });
  }
  populate(path: any, select?: string) {
    this.query.populate(path, select);
    return this;
  }
  select(selectFields: string) {
    this.query.select(selectFields);
    return this;
  }
  then(onfulfilled?: any, onrejected?: any) {
    return this.query.then(onfulfilled, onrejected);
  }
}

// Emulates Mongoose update instructions
function applyUpdate(doc: any, update: any) {
  if (update.$set) {
    for (const key of Object.keys(update.$set)) {
      doc[key] = update.$set[key];
    }
  } else {
    for (const key of Object.keys(update)) {
      if (key.startsWith("$")) continue;
      doc[key] = update[key];
    }
  }
}

// Mongoose base Model class
class Model {
  static modelName: string;
  static schema: any;

  _id: string;
  id: string;
  isNew: boolean;

  constructor(data: any = {}, isNew = true) {
    Object.assign(this, data);
    if (!this._id) {
      this._id = generateId();
    }
    this.id = this._id;
    this.isNew = isNew;

    if (isNew && (this.constructor as any).schema) {
      applyDefaults(this, (this.constructor as any).schema);
    }
  }

  static find(filter: any = {}) {
    return new Query(this, filter);
  }

  static findOne(filter: any = {}) {
    return new FindOneQuery(this, filter);
  }

  static findById(id: string) {
    return new FindByIdQuery(this, id);
  }

  static async create(data: any) {
    const doc = new this(data, true);
    await doc.save();
    return doc;
  }

  static async deleteMany(filter: any = {}) {
    const docs = await (this.find(filter) as any);
    let count = 0;
    for (const doc of docs) {
      await doc.delete();
      count++;
    }
    return { acknowledged: true, deletedCount: count };
  }

  static async countDocuments(filter: any = {}) {
    const docs = await (this.find(filter) as any);
    return docs.length;
  }

  static async distinct(field: string, filter: any = {}) {
    const docs = await (this.find(filter) as any);
    const vals = new Set();
    for (const doc of docs) {
      const val = getFieldValue(doc, field);
      if (val !== undefined && val !== null) {
        vals.add(val);
      }
    }
    return Array.from(vals);
  }

  static async findByIdAndUpdate(id: string, update: any, options: any = {}) {
    const doc = await (this.findById(id) as any);
    if (!doc) return null;
    applyUpdate(doc, update);
    await doc.save();
    return doc;
  }

  static async findOneAndDelete(filter: any) {
    const doc = await (this.findOne(filter) as any);
    if (!doc) return null;
    await doc.delete();
    return doc;
  }

  static async findByIdAndDelete(id: string) {
    const doc = await (this.findById(id) as any);
    if (!doc) return null;
    await doc.delete();
    return doc;
  }

  static async updateMany(filter: any, update: any) {
    const docs = await (this.find(filter) as any);
    for (const doc of docs) {
      applyUpdate(doc, update);
      await doc.save();
    }
    return { acknowledged: true, modifiedCount: docs.length };
  }

  static async updateOne(filter: any, update: any) {
    const doc = await (this.findOne(filter) as any);
    if (doc) {
      applyUpdate(doc, update);
      await doc.save();
      return { acknowledged: true, modifiedCount: 1 };
    }
    return { acknowledged: true, modifiedCount: 0 };
  }

  static async rawFindAll() {
    return rawFindAll(this.modelName);
  }

  async save() {
    const schema = (this.constructor as any).schema;
    if (schema && schema.preSaveHooks) {
      for (const hook of schema.preSaveHooks) {
        await hook.call(this);
      }
    }

    const savedData: any = {};
    for (const key of Object.keys(this)) {
      if (key === "isNew" || typeof this[key] === "function") continue;
      savedData[key] = this[key];
    }

    await rawSave((this.constructor as any).modelName, this._id, savedData);
    this.isNew = false;
    return this;
  }

  async delete() {
    await rawDelete((this.constructor as any).modelName, this._id);
  }

  toObject() {
    const obj: any = {};
    for (const key of Object.keys(this)) {
      if (key === "isNew" || typeof this[key] === "function") continue;
      obj[key] = this[key];
    }
    return obj;
  }

  toJSON() {
    return this.toObject();
  }
}

// Custom mock schema definition
class SchemaMock {
  definition: any;
  preSaveHooks: Function[] = [];
  paths: any;

  constructor(definition: any) {
    this.definition = definition;
    this.paths = definition;
  }

  pre(hook: string, fn: Function) {
    if (hook === "save") {
      this.preSaveHooks.push(fn);
    }
  }
}

// Register model classes
function modelMock(name: string, schema: SchemaMock) {
  if (modelsRegistry[name]) {
    return modelsRegistry[name];
  }

  const modelClass = class extends Model {
    static modelName = name;
    static schema = schema;
  };

  modelsRegistry[name] = modelClass;
  return modelClass;
}

// Mongoose Mock Root Interface
export const mongoose: any = {
  connect: async (uri?: string) => {},
  disconnect: async () => {},
  connection: {
    get readyState() {
      return 1;
    }
  },
  Schema: SchemaMock,
  model: modelMock,
  models: modelsRegistry,
  Types: {
    ObjectId: (id?: string) => id || generateId()
  }
};

mongoose.Schema.Types = {
  ObjectId: "ObjectId"
};

export default mongoose;
