"""SQLAlchemy 모델. 여기서 import해야 `create_all`이 테이블을 만든다."""

from app.models.admin import AdminAuditLog, RadarCandidate, RadarKeyword
from app.models.content import Badge, TechCard, TreeNode, UserBadge, UserCharacter
from app.models.experiment import Experiment, Mission, TrainingJob, TrialRecord
from app.models.support import Inquiry, Notification, Vote, VoteResponse
from app.models.user import AuthSession, User

__all__ = [
    "AdminAuditLog",
    "AuthSession",
    "Badge",
    "Experiment",
    "Inquiry",
    "Mission",
    "Notification",
    "RadarCandidate",
    "RadarKeyword",
    "TechCard",
    "TrainingJob",
    "TreeNode",
    "TrialRecord",
    "User",
    "UserBadge",
    "UserCharacter",
    "Vote",
    "VoteResponse",
]
