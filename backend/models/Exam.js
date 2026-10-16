const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    options: {
      type: [String],
      validate: {
        validator: (value) => value.length === 4,
        message: 'Each question must have exactly 4 options.'
      }
    },
    correctAnswer: { type: Number, required: true, min: 0, max: 3 },
    marks: { type: Number, default: 1, min: 1 }
  },
  { _id: true }
);

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    durationMinutes: { type: Number, required: true, min: 1 },
    isPublished: { type: Boolean, default: false },
    questions: { type: [questionSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exam', examSchema);
