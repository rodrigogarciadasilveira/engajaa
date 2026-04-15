const { SuggestionsService } = require('./suggestions.service');

const svc = new SuggestionsService();

class SuggestionsController {
  list = async (req, res, next) => {
    try {
      const suggestions = await svc.getSuggestions(req.tenantId);
      res.json(suggestions);
    } catch (err) { next(err); }
  };

  refresh = async (req, res, next) => {
    try {
      const suggestions = await svc.getSuggestions(req.tenantId, true);
      res.json(suggestions);
    } catch (err) { next(err); }
  };
}

module.exports = { SuggestionsController };
