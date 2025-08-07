import mongoose, { Document, Schema } from 'mongoose';

export interface IPRReport extends Document {
  prIdentifier: string; // Format: ${owner}:${repo}:${prNumber}
  userId: mongoose.Types.ObjectId;
  prMetadata: {
    title: string;
    number: number;
    owner: string;
    repo: string;
    author: string;
    state: string;
    created_at: string;
    url?: string;
  };
  playgroundConfig: {
    provider: string;
    model: string;
    systemPrompt: string;
    userPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  };
  analysisReport?: string; // Markdown/text report
  reportTitle?: string; // Custom title for the report
  savedAt: Date;
  updatedAt: Date;
}

const prReportSchema = new Schema<IPRReport>(
  {
    prIdentifier: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    prMetadata: {
      title: { type: String, required: true },
      number: { type: Number, required: true },
      owner: { type: String, required: true },
      repo: { type: String, required: true },
      author: { type: String, required: true },
      state: { type: String, required: true },
      created_at: { type: String, required: true },
      url: { type: String },
    },
    playgroundConfig: {
      provider: { type: String, required: true },
      model: { type: String, required: true },
      systemPrompt: { type: String, required: true },
      userPrompt: { type: String },
      temperature: { type: Number },
      maxTokens: { type: Number },
    },
    analysisReport: { type: String },
    reportTitle: { type: String },
    savedAt: {
      type: Date,
      default: Date.now,
      index: true, // Index for faster queries by savedAt
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'savedAt', updatedAt: 'updatedAt' },
  },
);

prReportSchema.index({ userId: 1, savedAt: -1 });

const PRReport = mongoose.model<IPRReport>('PRReport', prReportSchema);

export default PRReport;
