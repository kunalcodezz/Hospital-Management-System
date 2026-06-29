import { mongoose } from "../config/db";

const PaymentSchema = new mongoose.Schema({
  invoiceNumber: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  receiptUrl: { 
    type: String 
  },
  transactionId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  paymentMethod: { 
    type: String, 
    enum: ["credit_card", "paypal", "razorpay", "insurance", "cash"], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  tax: { 
    type: Number, 
    default: 0 
  },
  discount: { 
    type: Number, 
    default: 0 
  },
  couponCode: { 
    type: String, 
    default: "" 
  },
  refundStatus: { 
    type: String, 
    enum: ["none", "pending", "refunded"], 
    default: "none" 
  },
  paymentStatus: { 
    type: String, 
    enum: ["pending", "paid", "failed", "refunded"], 
    default: "pending" 
  },
  notes: { 
    type: String, 
    default: "" 
  },
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  appointmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Appointment", 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;
