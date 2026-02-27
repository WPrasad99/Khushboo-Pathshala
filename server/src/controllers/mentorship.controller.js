const mentorshipService = require('../services/mentorship.service');

exports.getMentorship = async (req, res, next) => {
    try {
        const result = await mentorshipService.getMentorship(req.user.id);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

exports.getMeetings = async (req, res, next) => {
    try {
        const result = await mentorshipService.getMeetings(req.user.id, req.query.filter);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

exports.getBatches = async (req, res, next) => {
    try {
        const result = await mentorshipService.getBatches(req.user.id);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};
