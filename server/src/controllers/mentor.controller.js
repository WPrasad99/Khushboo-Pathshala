const mentorService = require('../services/mentor.service');
const AppError = require('../utils/AppError');

exports.getBatches = async (req, res, next) => {
    try {
        const batches = await mentorService.getBatches(req.user.id);
        res.json({ success: true, data: batches });
    } catch (error) {
        next(error);
    }
};

exports.getStudents = async (req, res, next) => {
    try {
        // req.query is pre-parsed by Zod via validateMiddleware
        const students = await mentorService.getStudents(req.user.id, {
            batchId: req.query.batchId,
            search: req.query.search
        });
        res.json({ success: true, data: students });
    } catch (error) {
        next(error);
    }
};

exports.getMeetings = async (req, res, next) => {
    try {
        const result = await mentorService.getMeetings(req.user.id, {
            page: req.query.page,
            limit: req.query.limit,
            filter: req.query.filter
        });
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

exports.scheduleMeeting = async (req, res, next) => {
    try {
        const result = await mentorService.scheduleMeeting(req.user.id, req.body);
        res.status(201).json({
            success: true,
            data: result,
            message: `Meeting scheduled for ${result.scheduledFor} students.`
        });
    } catch (error) {
        next(error);
    }
};

exports.getAttendance = async (req, res, next) => {
    try {
        const batchId = req.query.batchId;
        if (!batchId) throw new AppError('batchId is required', 400, 'BAD_REQUEST');

        const activities = await mentorService.getAttendance(req.user.role, req.user.id, batchId);
        res.json({ success: true, data: activities });
    } catch (error) {
        next(error);
    }
};

exports.markAttendance = async (req, res, next) => {
    try {
        const { date, records, batchId } = req.body;

        const stats = await mentorService.markAttendance(req.user.id, req.user.role, batchId, date, records);
        res.json({ success: true, data: stats, message: 'Attendance processed successfully.' });
    } catch (error) {
        next(error);
    }
};

exports.uploadResource = async (req, res, next) => {
    try {
        const resource = await mentorService.uploadResource(req.user.id, req.user.role, req.body, req.file);
        res.status(201).json({ success: true, data: resource });
    } catch (error) {
        next(error);
    }
};

exports.getUploads = async (req, res, next) => {
    try {
        const typeFilter = req.query.type;
        const page = parseInt(req.query.page) || 1;

        const uploads = await mentorService.getUploads(req.user.id, typeFilter, page);
        res.json({ success: true, data: uploads });
    } catch (error) {
        next(error);
    }
};

exports.deleteUpload = async (req, res, next) => {
    try {
        const result = await mentorService.deleteUpload(req.user.id, req.user.role, req.params.id);
        res.json({ success: true, data: result, message: 'Resource deleted successfully.' });
    } catch (error) {
        next(error);
    }
};
