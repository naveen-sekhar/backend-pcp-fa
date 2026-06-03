// Analytics endpoints: GET /analytics/issues, /analytics/projects, /analytics/developers
const Issue = require('../models/Issue');
const Project = require('../models/Project');
const User = require('../models/User');

// GET /analytics/issues
async function issueAnalytics(req, res) {
  try {
    const totalIssues = await Issue.countDocuments();
    const openIssues = await Issue.countDocuments({ status: 'open' });
    const resolvedIssues = await Issue.countDocuments({ status: 'resolved' });
    const closedIssues = await Issue.countDocuments({ status: 'closed' });

    return res.status(200).json({
      success: true,
      message: 'Issue analytics fetched successfully',
      data: {
        totalIssues,
        openIssues,
        resolvedIssues,
        closedIssues
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// GET /analytics/projects
async function projectAnalytics(req, res) {
  try {
    // Project-wise issue count with project title and status
    const projects = await Project.find({});
    const data = [];

    for (const proj of projects) {
      const issueCount = await Issue.countDocuments({ projectId: proj.projectId });
      data.push({
        project: proj.title,
        issueCount,
        status: proj.status
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Project analytics fetched successfully',
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// GET /analytics/developers
async function developerAnalytics(req, res) {
  try {
    // Get all developers
    const developers = await User.find({ role: 'developer' });
    const data = [];
    let globalMax = 0;

    for (const dev of developers) {
      const resolvedIssues = await Issue.countDocuments({
        assignedTo: dev.userId,
        status: 'resolved'
      });

      // Average resolution time: difference between createdAt and updatedAt for resolved issues
      const resolvedDocs = await Issue.find({
        assignedTo: dev.userId,
        status: 'resolved'
      }).select('createdAt updatedAt');

      let averageResolutionTime = 0;
      if (resolvedDocs.length > 0) {
        const totalDays = resolvedDocs.reduce((sum, doc) => {
          const created = new Date(doc.createdAt);
          const updated = new Date(doc.updatedAt);
          const diffDays = Math.ceil((updated - created) / (1000 * 60 * 60 * 24));
          return sum + diffDays;
        }, 0);
        averageResolutionTime = Math.round(totalDays / resolvedDocs.length);
      }

      if (resolvedIssues > globalMax) globalMax = resolvedIssues;

      data.push({
        developer: dev.name,
        resolvedIssues,
        averageResolutionTime,
        highestResolvedIssueCount: resolvedIssues
      });
    }

    // Set the global highest across all developers
    data.forEach(d => { d.highestResolvedIssueCount = globalMax; });

    return res.status(200).json({
      success: true,
      message: 'Developer analytics fetched successfully',
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { issueAnalytics, projectAnalytics, developerAnalytics };
