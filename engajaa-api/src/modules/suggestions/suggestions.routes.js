const { Router } = require('express');
const { requireRole } = require('../../middlewares/roles');
const { SuggestionsController } = require('./suggestions.controller');

const suggestionsRouter = Router();
const ctrl = new SuggestionsController();

suggestionsRouter.get('/', requireRole('EDITOR'), ctrl.list);
suggestionsRouter.post('/refresh', requireRole('EDITOR'), ctrl.refresh);

module.exports = { suggestionsRouter };
