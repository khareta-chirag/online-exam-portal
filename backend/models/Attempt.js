const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    selectedAnswer: {
      type: Number,
      min: 0,
      max: 3,
      default: null
    }
  },
  { _id: false }
);

const snapshotQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    options: {
      type: [String],
      validate: {
        validator: (value) => value.length === 4,
        message: 'Question must have exactly 4 options.'
      }
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3
    },
    marks: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true
    },

    // Exact questions used when this attempt started
    questionsSnapshot: {
      type: [snapshotQuestionSchema],
      default: []
    },

    // Exam duration fixed at attempt start
    durationMinutesSnapshot: {
      type: Number,
      required: true,
      min: 1
    },

    startedAt: {
      type: Date,
      required: true,
      default: Date.now
    },

    submittedAt: {
      type: Date,
      default: null
    },

    answers: {
      type: [answerSchema],
      default: []
    },

    score: {
      type: Number,
      default: 0
    },

    totalMarks: {
      type: Number,
      default: 0
    },

    percentage: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ['in-progress', 'submitted'],
      default: 'in-progress'
    }
  },

  {
    timestamps: true
  }
);

// Prevent two active attempts for same student + exam
attemptSchema.index(
  { student: 1, exam: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: 'in-progress'
    }
  }
);

module.exports = mongoose.model('Attempt', attemptSchema);