// POST /sync logic: fetch → validate → insert into MongoDB
const axios = require('axios');
const User = require('../models/User');
const Project = require('../models/Project');
const Issue = require('../models/Issue');
const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');
const {
  sanitizeUser,
  sanitizeProject,
  sanitizeIssue,
  sanitizeComment,
  sanitizeActivityLog
} = require('../utils/sanitize');

const API_BASE_URL = 'https://t4e-testserver.onrender.com/api';

async function syncData(req, res) {
  try {
    // 1. Get token from public endpoint
    const tokenResponse = await axios.post(`${API_BASE_URL}/public/token`, {
      studentId: process.env.STUDENT_ID || 'E0223006',
      set: process.env.SET || 'setB',
      password: process.env.PASSWORD || '672598'
    });

    const token = tokenResponse.data.token;
    const dataUrl = tokenResponse.data.dataUrl;
    console.log('Token received, dataUrl:', dataUrl);

    // 2. Fetch private dataset using Bearer token
    const dataResponse = await axios.get(`${API_BASE_URL}${dataUrl}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const dataset = dataResponse.data.data;
    const users = dataset.users || [];
    const projects = dataset.projects || [];
    const issues = dataset.issues || [];
    const comments = dataset.comments || [];
    const activities = dataset.activities_log || [];

    let totalFetched = users.length + projects.length + issues.length + comments.length + activities.length;
    let inserted = 0;
    let duplicates = 0;
    let rejected = 0;

    // 3. Process Users
    for (const item of users) {
      const clean = sanitizeUser(item);
      if (!clean) { rejected++; continue; }
      const exists = await User.findOne({ userId: clean.userId });
      if (exists) { duplicates++; continue; }
      await User.create(clean);
      inserted++;
    }

    // 4. Process Projects
    for (const item of projects) {
      const clean = sanitizeProject(item);
      if (!clean) { rejected++; continue; }
      const exists = await Project.findOne({ projectId: clean.projectId });
      if (exists) { duplicates++; continue; }
      await Project.create(clean);
      inserted++;
    }

    // 5. Process Issues
    for (const item of issues) {
      const clean = sanitizeIssue(item);
      if (!clean) { rejected++; continue; }
      const exists = await Issue.findOne({ issueId: clean.issueId });
      if (exists) { duplicates++; continue; }
      await Issue.create(clean);
      inserted++;
    }

    // 6. Process Comments
    for (const item of comments) {
      const clean = sanitizeComment(item);
      if (!clean) { rejected++; continue; }
      const exists = await Comment.findOne({ commentId: clean.commentId });
      if (exists) { duplicates++; continue; }
      await Comment.create(clean);
      inserted++;
    }

    // 7. Process Activity Logs
    for (const item of activities) {
      const clean = sanitizeActivityLog(item);
      if (!clean) { rejected++; continue; }
      const exists = await ActivityLog.findOne({ logId: clean.logId });
      if (exists) { duplicates++; continue; }
      await ActivityLog.create(clean);
      inserted++;
    }

    return res.status(200).json({
      success: true,
      message: 'Dataset synchronized successfully',
      data: {
        totalFetched,
        inserted,
        duplicates,
        rejected
      }
    });

  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('Sync pipeline error:', errorMsg);
    return res.status(500).json({
      success: false,
      message: 'Sync pipeline failed: ' + errorMsg
    });
  }
}

module.exports = { syncData };
