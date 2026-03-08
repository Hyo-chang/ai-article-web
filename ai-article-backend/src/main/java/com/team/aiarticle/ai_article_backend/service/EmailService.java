package com.team.aiarticle.ai_article_backend.service;

import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import com.team.aiarticle.ai_article_backend.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    private static final String SITE_URL = "https://www.aharead.com";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy년 M월 d일");

    public void sendNewsDigest(User user, List<ArticleV2> articles) {
        if (articles.isEmpty()) {
            log.info("[EMAIL] userId={} 발송할 기사 없음 - 스킵", user.getUserId());
            return;
        }

        String date = LocalDate.now().format(DATE_FMT);
        String subject = "[AHAread] 오늘의 추천 기사 - " + date;
        String html = buildHtml(user.getUsername(), date, articles);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(user.getEmail());
            helper.setSubject(subject);
            helper.setText(html, true);
            helper.setFrom("AHAread <" + getFromAddress() + ">");
            mailSender.send(message);
            log.info("[EMAIL] 발송 완료 userId={} email={}", user.getUserId(), user.getEmail());
        } catch (MessagingException e) {
            log.error("[EMAIL] 발송 실패 userId={} email={} err={}", user.getUserId(), user.getEmail(), e.getMessage());
        }
    }

    private String getFromAddress() {
        try {
            return ((org.springframework.mail.javamail.JavaMailSenderImpl) mailSender).getUsername();
        } catch (Exception e) {
            return "noreply@aharead.com";
        }
    }

    private String buildHtml(String nickname, String date, List<ArticleV2> articles) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html lang='ko'><head><meta charset='UTF-8'></head><body style='margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;'>");
        sb.append("<table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f6f9;padding:32px 0;'>");
        sb.append("<tr><td align='center'>");
        sb.append("<table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>");

        // Header
        sb.append("<tr><td style='background:linear-gradient(135deg,#5B47FB,#7C6FFF);padding:32px 40px;text-align:center;'>");
        sb.append("<h1 style='margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;'>AHAread</h1>");
        sb.append("<p style='margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;'>").append(date).append(" 오늘의 추천 기사</p>");
        sb.append("</td></tr>");

        // Greeting
        sb.append("<tr><td style='padding:32px 40px 24px;'>");
        sb.append("<p style='margin:0;font-size:16px;color:#1a1a2e;'>안녕하세요, <strong>").append(escapeHtml(nickname)).append("</strong>님!</p>");
        sb.append("<p style='margin:8px 0 0;font-size:14px;color:#6b7280;'>관심 카테고리 기반 오늘의 추천 기사를 전달드립니다.</p>");
        sb.append("</td></tr>");

        // Divider
        sb.append("<tr><td style='padding:0 40px;'><hr style='border:none;border-top:1px solid #e5e7eb;margin:0;'></td></tr>");

        // Articles
        for (int i = 0; i < articles.size(); i++) {
            ArticleV2 article = articles.get(i);
            sb.append("<tr><td style='padding:24px 40px;'>");
            sb.append("<p style='margin:0 0 8px;font-size:12px;font-weight:600;color:#5B47FB;text-transform:uppercase;letter-spacing:0.08em;'>기사 ").append(i + 1).append("</p>");
            sb.append("<h2 style='margin:0 0 12px;font-size:18px;font-weight:700;color:#1a1a2e;line-height:1.4;'>")
                    .append(escapeHtml(article.getTitle())).append("</h2>");

            // Summary (3줄 요약)
            if (article.getSummarize() != null && !article.getSummarize().isBlank()) {
                String summary = article.getSummarize().strip();
                sb.append("<div style='background:#f9fafb;border-left:3px solid #5B47FB;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:16px;'>");
                sb.append("<p style='margin:0;font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;'>")
                        .append(escapeHtml(summary)).append("</p>");
                sb.append("</div>");
            }

            // Link
            String articleUrl = SITE_URL + "/content/" + article.getArticleId();
            sb.append("<a href='").append(articleUrl).append("' style='display:inline-block;background:#5B47FB;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;'>기사 읽기 →</a>");
            sb.append("</td></tr>");

            if (i < articles.size() - 1) {
                sb.append("<tr><td style='padding:0 40px;'><hr style='border:none;border-top:1px solid #e5e7eb;margin:0;'></td></tr>");
            }
        }

        // Footer
        sb.append("<tr><td style='background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;'>");
        sb.append("<p style='margin:0;font-size:12px;color:#9ca3af;text-align:center;'>이메일 수신을 원치 않으시면 <a href='").append(SITE_URL).append("/mypage' style='color:#5B47FB;'>마이페이지</a>에서 구독을 해제하세요.</p>");
        sb.append("<p style='margin:8px 0 0;font-size:12px;color:#9ca3af;text-align:center;'>© 2025 AHAread. All rights reserved.</p>");
        sb.append("</td></tr>");

        sb.append("</table></td></tr></table></body></html>");
        return sb.toString();
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
